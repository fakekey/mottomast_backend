import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { JwtUserExtract } from '../auth/auth.controller';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User } from '../common/decorator/decorator';
import { InvalidParameterFilter } from '../common/filter/invalid-paramater.filter';
import { ChatFileDto } from './dto/chat-file.dto';
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
  async getAllUser(
    @User() user: JwtUserExtract,
    @Query('keep', ParseBoolPipe) keep: boolean,
  ) {
    return await this.userService.getAllUser(user, keep);
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
  @Post('chat-file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public',
        filename: function (req, file, cb) {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  async chatFile(
    @User() user: JwtUserExtract,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any,
  ) {
    return await this.userService.chatFile(user, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('messages/:id')
  @UseGuards(JwtAuthGuard)
  async messages(@Param('id') id: string, @Query('page') page: string) {
    return await this.userService.messages(parseInt(id), parseInt(page));
  }
}
