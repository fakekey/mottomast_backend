import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { compare, hash } from 'bcrypt';

import { ErrorCode, throwHttpException } from '../common/error/error';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private readonly env: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const password = await hash(dto.password, 10);
      let room = await this.prisma.room.findFirst({
        where: {
          name: 'KÊNH CHAT CHUNG',
        },
      });
      if (room == null) {
        room = await this.prisma.room.create({
          data: {
            id: 1,
            name: 'KÊNH CHAT CHUNG',
          },
        });
      }
      const user = await this.prisma.user.create({
        data: {
          ...dto,
          password,
          nickName: dto.email.split('@')[0],
          rooms: {
            connect: {
              id: room.id,
            },
          },
        },
      });
      await this.prisma.unread.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          room: {
            connect: {
              id: room.id,
            },
          },
        },
      });
      delete user.password;
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            throwHttpException(ErrorCode.EMAIL_EXISTED);
        }
      }
    }
  }

  async getAuthenticatedUser(email: string, password: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email },
      });
      await this.verifyPassword(password, user.password);
      return user;
    } catch (error) {
      throwHttpException(ErrorCode.WRONG_CREDENTIALS);
    }
  }

  private async verifyPassword(plain: string, hashed: string) {
    const isPasswordMatching = await compare(plain, hashed);
    if (!isPasswordMatching) throwHttpException(ErrorCode.WRONG_CREDENTIALS);
  }

  async loginHandler(params: { user: User; device: any }) {
    const { user, device } = params;
    const sub = user.id;
    const token = await this.getTokens(user.email, sub);
    return token;
  }

  private async getTokens(email: string, sub: number): Promise<Tokens> {
    const accessToken = await this.jwt.signAsync(
      {
        sub,
        email,
      },
      {
        secret: this.env.get('ACCESS_TOKEN_SECRET'),
        expiresIn: this.env.get('ACCESS_TOKEN_LIFE_LONG'),
      },
    );

    return { accessToken };
  }
}

export type Tokens = {
  accessToken: string;
};
