import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { Discount } from '../entities';

describe('DiscountService', () => {
  let service: DiscountService;
  let discountRepository: jest.Mocked<Repository<Discount>>;

  const mockDiscountId = 'discount-uuid-123';

  const mockDiscount: Partial<Discount> = {
    id: mockDiscountId,
    name: 'Weekly Discount',
    description: 'Get 10% off for stays of 7 days or more',
    discountPercentage: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockDiscountRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        {
          provide: getRepositoryToken(Discount),
          useValue: mockDiscountRepo,
        },
      ],
    }).compile();

    service = module.get<DiscountService>(DiscountService);
    discountRepository = module.get(getRepositoryToken(Discount));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new discount', async () => {
      const createDto = {
        name: 'New Discount',
        description: 'A new discount',
        discountPercentage: 15,
        isActive: true,
      };

      discountRepository.create.mockReturnValue(createDto as Discount);
      discountRepository.save.mockResolvedValue({
        ...createDto,
        id: 'new-id',
      } as Discount);

      const result = await service.create(createDto);

      expect(discountRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        description: createDto.description,
        discountPercentage: createDto.discountPercentage,
        isActive: createDto.isActive,
      });
      expect(discountRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(createDto.name);
    });

    it('should create discount with default isActive=true when not provided', async () => {
      const createDto = {
        name: 'New Discount',
        discountPercentage: 15,
      };

      discountRepository.create.mockReturnValue({ ...createDto, isActive: true } as Discount);
      discountRepository.save.mockResolvedValue({
        ...createDto,
        isActive: true,
        id: 'new-id',
      } as Discount);

      const result = await service.create(createDto);

      expect(result.isActive).toBe(true);
    });
  });

  describe('update', () => {
    it('should update an existing discount', async () => {
      const updateDto = {
        name: 'Updated Discount',
        discountPercentage: 20,
      };

      discountRepository.findOne.mockResolvedValue(mockDiscount as Discount);
      discountRepository.save.mockResolvedValue({
        ...mockDiscount,
        ...updateDto,
      } as Discount);

      const result = await service.update(mockDiscountId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.discountPercentage).toBe(updateDto.discountPercentage);
    });

    it('should throw NotFoundException if discount not found', async () => {
      discountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockDiscountId, { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      const updateDto = {
        isActive: false,
      };

      discountRepository.findOne.mockResolvedValue({ ...mockDiscount } as Discount);
      discountRepository.save.mockImplementation((discount) =>
        Promise.resolve(discount as Discount),
      );

      const result = await service.update(mockDiscountId, updateDto);

      expect(result.name).toBe(mockDiscount.name); // unchanged
      expect(result.isActive).toBe(false); // changed
    });
  });

  describe('findAll', () => {
    it('should return all discounts', async () => {
      const allDiscounts = [
        mockDiscount,
        { ...mockDiscount, id: 'discount-2', name: 'Monthly Discount' },
      ];
      discountRepository.find.mockResolvedValue(allDiscounts as Discount[]);

      const result = await service.findAll();

      expect(discountRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findActive', () => {
    it('should return only active discounts', async () => {
      const activeDiscounts = [mockDiscount];
      discountRepository.find.mockResolvedValue(activeDiscounts as Discount[]);

      const result = await service.findActive();

      expect(discountRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return a discount by ID', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount as Discount);

      const result = await service.findById(mockDiscountId);

      expect(result).toEqual(mockDiscount);
    });

    it('should throw NotFoundException if discount not found', async () => {
      discountRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a discount', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount as Discount);
      discountRepository.remove.mockResolvedValue(mockDiscount as Discount);

      await service.delete(mockDiscountId);

      expect(discountRepository.remove).toHaveBeenCalledWith(mockDiscount);
    });

    it('should throw NotFoundException if discount not found', async () => {
      discountRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
