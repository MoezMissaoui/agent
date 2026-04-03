import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  /** Si true, durées JWT allongées (session persistante) */
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
