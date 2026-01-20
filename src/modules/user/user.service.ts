import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return await this.findById(id);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'isEmailVerified', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllExcept(excludeUserId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { id: Not(excludeUserId) },
      select: ['id', 'name', 'email', 'role', 'isEmailVerified', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }
}