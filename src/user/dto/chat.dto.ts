import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ChatDto {
  @IsNotEmpty()
  @IsInt()
  room: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
