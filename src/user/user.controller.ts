import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { JwtUserExtract } from '../auth/auth.controller';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User } from '../common/decorator/decorator';
import { InvalidParameterFilter } from '../common/filter/invalid-paramater.filter';
import { ChatDto } from './dto/chat.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UserService } from './user.service';

@Controller('user')
@UseFilters(InvalidParameterFilter)
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get('info')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@User() user: JwtUserExtract) {
    return await this.userService.getUserInfo(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('get-all')
  @UseGuards(JwtAuthGuard)
  async getAllUser(@User() user: JwtUserExtract) {
    return await this.userService.getAllUser(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('create-room')
  @UseGuards(JwtAuthGuard)
  async createRoom(@User() user: JwtUserExtract, @Body() dto: CreateRoomDto) {
    return await this.userService.createRoom(user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@User() user: JwtUserExtract, @Body() dto: ChatDto) {
    return await this.userService.chat(user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('messages/:id')
  @UseGuards(JwtAuthGuard)
  async messages(@Param('id') id: string) {
    return await this.userService.messages(parseInt(id));
  }
}
