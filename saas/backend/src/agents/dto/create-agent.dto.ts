import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: 'Support assistant' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Optional scope / mission text', maxLength: 512000 })
  @IsOptional()
  @IsString()
  @MaxLength(512000)
  description?: string;
}
