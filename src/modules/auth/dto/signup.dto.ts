import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../user/enums/role.enum';
import { Match } from '../../../common/decorators/match.decorator';

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}