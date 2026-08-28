import { ConflictException, Injectable } from '@nestjs/common';

import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto) {
    const exists = await this.usersService.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return {
      message: 'Registration successful',
      user,
    };
  }
}
