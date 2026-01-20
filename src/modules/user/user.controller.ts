import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './enums/role.enum';
import { ApiResponse } from '../../utils/apiResponse';

@ApiTags('Admin')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of all users retrieved successfully',
    schema: {
      example: {
        status: 200,
        response: 'OK',
        message: 'Users retrieved successfully',
        data: [
          {
            id: 'uuid-here-1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user',
            isEmailVerified: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
          {
            id: 'uuid-here-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'host',
            isEmailVerified: true,
            createdAt: '2024-01-14T09:20:00.000Z',
            updatedAt: '2024-01-14T09:20:00.000Z',
          },
        ],
      },
    },
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @SwaggerApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllUsers(@CurrentUser() currentUser: any) {
    const users = await this.userService.findAllExcept(currentUser.userId);
    return ApiResponse.SUCCESS(users, 'Users retrieved successfully');
  }
}