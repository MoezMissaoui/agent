import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameChatSessionDto {
  @ApiProperty({ example: 'Project notes Q1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;
}
