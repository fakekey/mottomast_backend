import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  targets: number[];

  @IsString()
  name: string;
}
