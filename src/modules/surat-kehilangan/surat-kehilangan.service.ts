import { ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDto, FindAllSuratKehilanganDto, UpdateDto } from './dto/surat-kehilangan.dto';
import { FieldConflictException } from '@/common/utils/fieldConflictException';
import { deleteFileFromDisk, handleUploadAndUpdate } from '@/common/utils/file';

@Injectable()
export class SuratKehilanganService {
  private readonly UPLOAD_PATH = 'surat-kehilangan';

  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto, files: { [key: string]: Express.Multer.File[] }, userId: number) {
    try {
      const checkNIK = await this.prisma.suratKehilangan.findUnique({
        where: { nik: data.nik },
      });
      if (checkNIK) {
        throw new FieldConflictException('nik', 'Surat Kehilangan dengan nik tersebut sudah ada di arsip');
      }

      const finalData = {
        ...data,
        createdById: userId,
        file: `${this.UPLOAD_PATH}/${files.file![0].filename}`,
      };
      return this.prisma.suratKehilangan.create({ data: finalData });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal menambahkan surat kehilangan baru');
    }
  }

  async findAll(dto: FindAllSuratKehilanganDto, userId?: number) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'asc',
    } = dto;

    const where: any = {};

    if (userId) where.createdById = userId;

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.suratKehilangan.count({ where }),
      this.prisma.suratKehilangan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      success: true,
      message: 'Daftar Surat Kehilangan berhasil diambil',
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }

  async findOne(id: number, userId?: number) {
    try {
      const data = await this.prisma.suratKehilangan.findFirstOrThrow({
        where: { id }
      });

      if (userId && data.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan mengambil surat kehilangan ini.");

      return {
        message: 'Surat kehilangan berhasil diambil',
        data: data,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat Kehilangan tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data akte kehilangan');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
    userId?: number,
  ) {
    try {
      const record = await this.prisma.suratKehilangan.findFirstOrThrow({ where: { id } });
      if (userId && record.createdById !== userId) throw new ForbiddenException('Anda tidak diizinkan memperbarui akta ini.');

      const uploadSubfolder = this.UPLOAD_PATH;

      const updatedData = {
        ...data,
        file: files.file?.[0]
          ? await handleUploadAndUpdate({
            file: files.file[0],
            oldFilePath: record.file,
            uploadSubfolder,
          })
          : record.file,
      };

      return this.prisma.$transaction(async (tx) => {
        const updatedRecord = await tx.suratKehilangan.update({
          where: { id },
          data: updatedData,
        });
        return updatedRecord;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat kehilangan tidak ditemukan');
      }

      throw new InternalServerErrorException('Gagal memperbarui data surat kehilangan');
    }
  }

  async remove(id: number, userId?: number) {
    try {
      const record = await this.prisma.suratKehilangan.findFirstOrThrow({ where: { id } });

      if (userId && record.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan menghapus data ini.")

      await this.prisma.suratKehilangan.delete({ where: { id } });

      await Promise.all([
        deleteFileFromDisk(record.file),
      ]);

      return {
        success: true,
        message: 'Surat Kehilangan berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat kehilangan tidak ditemukan');
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal menghapus Surat Kehilangan');
    }
  }
}
