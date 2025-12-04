import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CreateKategoriDto,
  FindAllKategoriDto,
  UpdateKategoriDto,
} from './dto/kategori.dto';
import { PrismaService } from 'prisma/prisma.service';
import {
  handleCreateError,
  handleDeleteError,
  handleFindError,
  handleUpdateError,
} from '@/common/utils/handle-prisma-error';
import {
  deletedResponse,
  foundResponse,
  listResponse,
  updatedResponse,
  SuccessResponse,
} from '@/common/utils/success-helper';
import { Kategori } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KategoriService {
  private readonly logger = new Logger(KategoriService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createKategoriDto: CreateKategoriDto) {
    try {
      const slug = createKategoriDto.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

      const existing = await this.prisma.kategori.findUnique({
        where: { slug },
      });

      if (existing) {
        throw new BadRequestException(
          'Kategori dengan nama tersebut sudah ada',
        );
      }

      const created = await this.prisma.kategori.create({
        data: {
          ...createKategoriDto,
          slug,
        },
      });

      await this.cacheManager.clear(); // Invalidate all cache

      return {
        message: 'Kategori berhasil dibuat',
        data: created,
      };
    } catch (error) {
      this.logger.error(error);
      handleCreateError(error, 'Kategori');
    }
  }

  async findAll(dto: FindAllKategoriDto) {
    const cacheKey = `kategori_list_${JSON.stringify(dto)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'desc',
    } = dto;

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.kategori.count({ where }),
      this.prisma.kategori.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    const response = listResponse('Kategori', data, meta);
    await this.cacheManager.set(cacheKey, response, 60000); // 1 minute TTL
    return response;
  }

  async findOne(id: number): Promise<SuccessResponse<Kategori>> {
    try {
      const cacheKey = `kategori_detail_${id}`;
      const cached =
        await this.cacheManager.get<SuccessResponse<Kategori>>(cacheKey);
      if (cached) {
        return cached;
      }

      const data = await this.prisma.kategori.findFirstOrThrow({
        where: { id },
      });

      const response = foundResponse('Kategori', data);
      await this.cacheManager.set(cacheKey, response, 300000); // 5 minutes TTL
      return response;
    } catch (error) {
      handleFindError(error, 'Kategori');
      throw error; // Ensure it throws so return type is valid
    }
  }

  async findBySlug(slug: string): Promise<SuccessResponse<Kategori>> {
    try {
      const cacheKey = `kategori_slug_${slug}`;
      const cached =
        await this.cacheManager.get<SuccessResponse<Kategori>>(cacheKey);
      if (cached) {
        return cached;
      }

      const data = await this.prisma.kategori.findUniqueOrThrow({
        where: { slug },
      });

      const response = foundResponse('Kategori', data);
      await this.cacheManager.set(cacheKey, response, 300000); // 5 minutes TTL
      return response;
    } catch (error) {
      handleFindError(error, 'Kategori');
      throw error;
    }
  }

  async update(id: number, updateKategoriDto: UpdateKategoriDto) {
    try {
      await this.prisma.kategori.findFirstOrThrow({
        where: { id },
      });

      const updated = await this.prisma.kategori.update({
        where: { id },
        data: updateKategoriDto,
      });

      await this.cacheManager.del(`kategori_detail_${id}`);
      await this.cacheManager.clear(); // Invalidate lists

      return updatedResponse('Kategori', updated);
    } catch (error) {
      this.logger.error(error);
      handleUpdateError(error, 'Kategori');
    }
  }

  async remove(id: number, password?: string, userId?: number) {
    try {
      // 1. Validasi Password
      if (!password) {
        throw new BadRequestException('Password konfirmasi diperlukan');
      }
      if (!userId) {
        this.logger.error('User ID not found in request for category deletion');
        throw new UnauthorizedException('User tidak terautentikasi');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Password salah');
      }

      // 2. Cek Kategori
      const kategori = await this.prisma.kategori.findUnique({
        where: { id },
        include: {
          arsipSemuas: {
            include: {
              arsipFiles: true,
            },
          },
        },
      });

      if (!kategori) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }

      // 3. Hapus File Fisik
      const filesToDelete: string[] = [];
      kategori.arsipSemuas.forEach((arsip) => {
        arsip.arsipFiles.forEach((file) => {
          filesToDelete.push(file.path);
        });
      });

      // Lakukan penghapusan file fisik
      filesToDelete.forEach((filePath) => {
        try {
          const fullPath = path.join(process.cwd(), 'uploads', filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (err) {
          this.logger.error(`Gagal menghapus file fisik: ${filePath}`, err);
        }
      });

      // 4. Hapus Data di Database (Cascade akan menangani ArsipSemua dan ArsipFile)
      await this.prisma.kategori.delete({
        where: { id },
      });

      await this.cacheManager.del(`kategori_detail_${id}`);
      await this.cacheManager.clear(); // Invalidate lists

      return deletedResponse('Kategori');
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      handleDeleteError(error, 'Kategori');
    }
  }
}
