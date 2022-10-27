import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtUserExtract } from './auth/auth.controller';
import { PrismaService } from './common/prisma/prisma.service';

@WebSocketGateway({
  namespace: 'cable',
  cors: true,
  transports: ['websocket', 'polling'],
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private prisma: PrismaService,
    private readonly env: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    AppSocket.server = server;
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.headers.authorization;
    const jwt = new JwtService({ secret: this.env.get('ACCESS_TOKEN_SECRET') });
    const decode = jwt.decode(token) as JwtUserExtract;
    const user = await this.prisma.user.findUnique({
      where: {
        id: decode.sub,
      },
      include: {
        rooms: true,
      },
    });
    AppSocket.addUser(user.id, client);
  }

  handleDisconnect(client: Socket) {
    AppSocket.removeUser(client.id);
    console.warn(`${client.id} disconnected`);
  }

  @SubscribeMessage('JOIN_ROOM')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const token = client.handshake.headers.authorization;
    const jwt = new JwtService({ secret: this.env.get('ACCESS_TOKEN_SECRET') });
    const decode = jwt.decode(token) as JwtUserExtract;
    const user = await this.prisma.user.findUnique({
      where: {
        id: decode.sub,
      },
      include: {
        rooms: true,
      },
    });
    const { prevRoomId, currentRoomId } = payload;
    if (prevRoomId) client.leave(`room:${prevRoomId}`);
    client.join(`user:${user.id}`);
    client.join(`room:${currentRoomId}`);
    console.log([...client.rooms]);
    const targetUnread = await this.prisma.unread.findFirst({
      where: {
        userId: user.id,
        roomId: currentRoomId,
      },
    });
    const res = await this.prisma.unread.update({
      where: {
        id: targetUnread.id,
      },
      data: {
        count: 0,
      },
    });
    client.emit('UNREAD_COUNT_CHANGED', {
      roomId: res.roomId,
      count: res.count,
    });
  }
}

export class AppSocket {
  static server: Server;
  static listUser: SocketItem[] = [];

  static addUser = (uId: number, userClient: Socket) => {
    if (!AppSocket.listUser.some((u) => u.userId === uId)) {
      AppSocket.listUser.push(new SocketItem(uId, userClient));
    }
    AppSocket.listUser = AppSocket.listUser.map((e) => {
      if (e.userId === uId) return new SocketItem(uId, userClient);
      return e;
    });
  };

  static removeUser = (socketId) => {
    AppSocket.listUser = AppSocket.listUser.filter(
      (user) => user.client.id !== socketId,
    );
  };
}

export class SocketItem {
  constructor(public userId: number, public client: Socket) {}
}
