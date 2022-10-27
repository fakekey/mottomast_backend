import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ChatFileDto {
  @IsNotEmpty()
  @IsInt()
  room: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  @IsInt()
  type: number;
}