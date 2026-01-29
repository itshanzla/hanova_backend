import { ApiProperty } from '@nestjs/swagger';

// =====================
// Validation Error Schema
// =====================
export class ValidationErrorResponse {
  @ApiProperty({
    description: 'Validation error messages',
    example: [
      'category must be one of: house, apartment, barn, ...',
      'guests must be greater than 0',
    ],
    isArray: true,
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    example: 400,
  })
  statusCode: number;
}

// =====================
// Unauthorized Error Schema
// =====================
export class UnauthorizedErrorResponse {
  @ApiProperty({
    example: 'Unauthorized',
  })
  message: string;

  @ApiProperty({
    example: 401,
  })
  statusCode: number;
}

// =====================
// Forbidden Error Schema
// =====================
export class ForbiddenErrorResponse {
  @ApiProperty({
    example: 'You do not have access to this listing',
  })
  message: string;

  @ApiProperty({
    example: 'Forbidden',
  })
  error: string;

  @ApiProperty({
    example: 403,
  })
  statusCode: number;
}

// =====================
// Not Found Error Schema
// =====================
export class NotFoundErrorResponse {
  @ApiProperty({
    example: 'Listing not found',
  })
  message: string;

  @ApiProperty({
    example: 'Not Found',
  })
  error: string;

  @ApiProperty({
    example: 404,
  })
  statusCode: number;
}

// =====================
// Bad Request Error Schema (Business Logic)
// =====================
export class BadRequestErrorResponse {
  @ApiProperty({
    example: 'Cannot publish listing. Incomplete steps: Step 1 (Property Details), Step 2 (Amenities & Media)',
  })
  message: string;

  @ApiProperty({
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    example: 400,
  })
  statusCode: number;
}

// =====================
// Invalid Discount IDs Error Schema
// =====================
export class InvalidDiscountIdsErrorResponse {
  @ApiProperty({
    example: 'Invalid or inactive discount IDs: abc123, def456',
  })
  message: string;

  @ApiProperty({
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    example: 400,
  })
  statusCode: number;
}

// =====================
// Internal Server Error Schema
// =====================
export class InternalServerErrorResponse {
  @ApiProperty({
    example: 'Internal server error',
  })
  message: string;

  @ApiProperty({
    example: 500,
  })
  statusCode: number;
}
