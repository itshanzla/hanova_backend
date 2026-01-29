import { IsArray, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step4DiscountsDto {
  @ApiProperty({
    description: 'Array of discount IDs to apply',
    example: ['uuid-1', 'uuid-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each discount ID must be a valid UUID' })
  discountIds?: string[];
}
