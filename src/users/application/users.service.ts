import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../domain/user.entity';
import { UserProfile } from '../domain/user-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserProfile) private readonly profilesRepo: Repository<UserProfile>,
  ) {}

  async create(data: { email: string; password: string; firstName: string; lastName: string; phone?: string; dateOfBirth?: string; gender?: string }) {
    const existing = await this.usersRepo.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con este email');

    const user = this.usersRepo.create({
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
    });
    const saved = await this.usersRepo.save(user);

    const profile = this.profilesRepo.create({
      userId: saved.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
    });
    await this.profilesRepo.save(profile);

    return this.findOne(saved.id);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({ relations: ['profile'], select: ['id', 'email', 'isActive', 'createdAt'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id }, relations: ['profile', 'userRoles', 'userRoles.role'] });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email }, relations: ['profile'] });
  }

  async update(id: number, data: Partial<{ email: string; password: string; firstName: string; lastName: string; phone: string; isActive: boolean }>) {
    const user = await this.findOne(id);
    if (data.password) { user.passwordHash = await bcrypt.hash(data.password, 10); }
    if (data.email) user.email = data.email;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    await this.usersRepo.save(user);

    if (user.profile && (data.firstName || data.lastName || data.phone)) {
      if (data.firstName) user.profile.firstName = data.firstName;
      if (data.lastName) user.profile.lastName = data.lastName;
      if (data.phone) user.profile.phone = data.phone;
      await this.profilesRepo.save(user.profile);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  }
}
