import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppGateway } from 'src/app.gateway';

import { PrismaModule } from '../common/prisma/prisma.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
