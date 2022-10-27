import { Injectable } from '@nestjs/common';
import { AppSocket } from 'src/app.gateway';
import { ErrorCode, throwHttpException } from 'src/common/error/error';

import { JwtUserExtract } from '../auth/auth.controller';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserInfo(user: JwtUserExtract) {
    const { password, ...result } = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
      include: {
        rooms: {
          include: {
            users: {
              select: {
                id: true,
                fullName: true,
                nickName: true,
                email: true,
              },
            },
            unreads: true,
          },
        },
      },
    });
    return result;
  }

  async getAllUser(user: JwtUserExtract) {
    return await this.prisma.user.findMany({
      where: {
        id: {
          not: user.sub,
        },
      },
      select: {
        id: true,
        fullName: true,
        nickName: true,
        email: true,
      },
    });
  }

  async createRoom(user: JwtUserExtract, dto: CreateRoomDto) {
    let { targets, name } = dto;
    if (name) {
      const findSameName = await this.prisma.room.findFirst({
        where: {
          name,
        },
      });
      if (findSameName) {
        throwHttpException(ErrorCode.ROOM_EXISTED);
      }
    }
    targets = [...targets, user.sub];
    targets = targets.slice().sort();
    const findRoom = await this.prisma.room.findMany({
      where: {
        users: {
          some: {
            id: user.sub,
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            nickName: true,
            email: true,
          },
        },
      },
    });
    const existRoom = findRoom.filter((e) => {
      const userIds = e.users.map((e) => e.id);
      return (
        userIds.length === targets.length &&
        userIds
          .slice()
          .sort()
          .every((value, index) => value === targets[index])
      );
    });

    if (existRoom.length > 0) {
      throwHttpException(ErrorCode.ROOM_EXISTED);
    }

    const connectTarget = targets.map(function (e) {
      return {
        id: e,
      };
    });

    let res = await this.prisma.room.create({
      data: {
        name: name ? name : null,
        users: {
          connect: connectTarget,
        },
      },
    });

    for (const userTarget of connectTarget) {
      await this.prisma.unread.create({
        data: {
          user: {
            connect: {
              id: userTarget.id,
            },
          },
          room: {
            connect: {
              id: res.id,
            },
          },
        },
      });
    }

    res = await this.prisma.room.findUnique({
      where: {
        id: res.id,
      },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            nickName: true,
            email: true,
          },
        },
        unreads: true,
      },
    });
    for (const notiUserId of connectTarget) {
      AppSocket.server.to(`user:${notiUserId.id}`).emit('ROOM_CREATED', {
        roomId: res.id,
        createdByUserId: user.sub,
      });
    }
    return res;
  }

  async chat(user: JwtUserExtract, dto: ChatDto) {
    const { room, content } = dto;
    const res = await this.prisma.message.create({
      data: {
        userId: user.sub,
        roomId: room,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nickName: true,
            email: true,
          },
        },
      },
    });
    return res;
  }

  async messages(roomId: number) {
    const res = await this.prisma.message.findMany({
      where: {
        roomId: roomId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            nickName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return res;
  }
}
