import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateDto, FindAllUserDto, UpdateDto } from './dto/user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { hash } from '@/modules/auth/auth.util';
import { FieldConflictException } from '@/common/utils/fieldConflictException';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto) {
    try {
      const checkUsername = await this.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (checkUsername) {
        throw new FieldConflictException('username', 'Username sudah terdaftar');
      }

      const checkEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (checkEmail) {
        throw new FieldConflictException('email', 'Email sudah terdaftar');
      }


      data.password = await hash(data.password);

      const { confirmPassword, ...finalData } = data;

      const user = await this.prisma.user.create({
        data: finalData,
      })

      const { password, refreshToken, ...userData } = user;
      return {
        message: 'Akun berhasil dibuat',
        data: userData,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal membuat akun baru');
    }
  }

  async findAll(dto: FindAllUserDto) {
    const { page, limit, search, role, statusUser, sortBy, sortOrder } = dto;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (statusUser) {
      where.statusUser = statusUser;
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          statusUser: true,
          createdAt: true,
          updatedAt: true
        },
      }),
    ]);

    return {
      message: 'Daftar user berhasil diambil',
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findFirstOrThrow({
        where: { id }
      });

      const { password, refreshToken, ...userData } = user;

      return {
        message: 'Data akun berhasil diambil',
        data: userData,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data user');
    }
  }

  async update(id: number, data: UpdateDto) {
    try {
      const existing = await this.prisma.user.findFirstOrThrow({
        where: { id }
      });

      const checkUsername = await this.prisma.user.findFirst({
        where: { username: data.username, NOT: { id: id } },
      });
      if (checkUsername) {
        throw new FieldConflictException('username', 'Username sudah terdaftar');
      }

      const checkEmail = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id: id } },
      });
      if (checkEmail) {
        throw new FieldConflictException('email', 'Email sudah terdaftar');
      }

      if (data.password) {
        data.password = await hash(data.password);
      }
      const { confirmPassword, ...finalData } = data;

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: finalData,
      });

      const { password, refreshToken, ...userData } = updatedUser;
      return {
        message: 'User berhasil diperbarui',
        data: userData,
      };

    } catch (error) {
      console.error(error);
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal memperbarui user');
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User tidak ditemukan');
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return {
        message: 'User berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User tidak ditemukan');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Gagal menghapus user');
    }
  }
}
