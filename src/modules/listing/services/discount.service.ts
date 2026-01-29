import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount } from '../entities';
import { CreateDiscountDto, UpdateDiscountDto } from '../dto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
  ) {}

  /**
   * Create a new discount (admin only)
   */
  async create(dto: CreateDiscountDto): Promise<Discount> {
    const discount = this.discountRepository.create({
      name: dto.name,
      description: dto.description,
      discountPercentage: dto.discountPercentage,
      isActive: dto.isActive ?? true,
    });
    return this.discountRepository.save(discount);
  }

  /**
   * Update an existing discount (admin only)
   */
  async update(id: string, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.findById(id);

    if (dto.name !== undefined) {
      discount.name = dto.name;
    }
    if (dto.description !== undefined) {
      discount.description = dto.description;
    }
    if (dto.discountPercentage !== undefined) {
      discount.discountPercentage = dto.discountPercentage;
    }
    if (dto.isActive !== undefined) {
      discount.isActive = dto.isActive;
    }

    return this.discountRepository.save(discount);
  }

  /**
   * Get all discounts (admin only)
   */
  async findAll(): Promise<Discount[]> {
    return this.discountRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all active discounts (for host usage)
   */
  async findActive(): Promise<Discount[]> {
    return this.discountRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get discount by ID
   */
  async findById(id: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    return discount;
  }

  /**
   * Delete a discount (admin only)
   */
  async delete(id: string): Promise<void> {
    const discount = await this.findById(id);
    await this.discountRepository.remove(discount);
  }
}
