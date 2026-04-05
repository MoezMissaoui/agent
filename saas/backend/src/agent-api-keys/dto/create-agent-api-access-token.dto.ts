import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAgentApiAccessTokenDto {
  @ApiProperty({ example: 'Production server' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  /** ISO 8601 datetime or omit / null for no expiry. */
  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z', nullable: true })
  @IsOptional()
  @IsString()
  expiresAt?: string | null;
}
