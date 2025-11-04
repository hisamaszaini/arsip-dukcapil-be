import { ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FieldConflictException } from '@/common/utils/fieldConflictException';
import { deleteFileFromDisk, handleUploadAndUpdate } from '@/common/utils/file';
import { CreateDto, FindAllSuratPerubahanKependudukanDto, UpdateDto } from './dto/surat-perubahan-kependudukan.dto';

@Injectable()
export class SuratPerubahanKependudukanService {
  private readonly UPLOAD_PATH = 'surat-perubahan-kependudukan';

  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto, files: { [key: string]: Express.Multer.File[] }, userId: number) {
    try {
      const checkNIK = await this.prisma.suratPerubahanKependudukan.findUnique({
        where: { nik: data.nik },
      });
      if (checkNIK) {
        throw new FieldConflictException('nik', 'Surat Surat Perubahan Kependudukan dengan nik tersebut sudah ada di arsip');
      }

      const finalData = {
        ...data,
        createdById: userId,
        filePerubahan: `${this.UPLOAD_PATH}/${files.filePerubahan![0].filename}`,
        fileKk: `${this.UPLOAD_PATH}/${files.fileKk![0].filename}`,
        fileLampiran: files.fileLampiran?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileLampiran[0].filename}`
          : null,
      };
      return this.prisma.suratPerubahanKependudukan.create({ data: finalData });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal menambahkan surat perubahan kependudukan baru');
    }
  }

  async findAll(dto: FindAllSuratPerubahanKependudukanDto, userId?: number) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'desc',
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
      this.prisma.suratPerubahanKependudukan.count({ where }),
      this.prisma.suratPerubahanKependudukan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      success: true,
      message: 'Daftar Surat Surat Perubahan Kependudukan berhasil diambil',
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
      const data = await this.prisma.suratPerubahanKependudukan.findFirstOrThrow({
        where: { id }
      });

      if (userId && data.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan mengambil surat perubahan kependudukan ini.");

      return {
        message: 'Surat perubahan kependudukan berhasil diambil',
        data: data,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat Surat Perubahan Kependudukan tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data surat perubahan kependudukan');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
    userId?: number
  ) {
    try {
      const record = await this.prisma.suratPerubahanKependudukan.findFirstOrThrow({ where: { id } });
      if (userId && record.createdById !== userId) throw new ForbiddenException('Anda tidak diizinkan memperbarui surat ini.');

      const uploadSubfolder = this.UPLOAD_PATH;

      const updatedData = {
        ...data,
        filePerubahan: files.filePerubahan?.[0]
          ? await handleUploadAndUpdate({
            file: files.filePerubahan[0],
            oldFilePath: record.filePerubahan,
            uploadSubfolder,
          })
          : record.filePerubahan,
        fileKk: files.fileKk?.[0]
          ? await handleUploadAndUpdate({
            file: files.fileKk[0],
            oldFilePath: record.fileKk,
            uploadSubfolder,
          })
          : record.fileKk,
        fileLampiran: files.fileLampiran?.[0]
          ? await handleUploadAndUpdate({
            file: files.fileLampiran[0],
            oldFilePath: record.fileLampiran ?? undefined,
            uploadSubfolder,
          })
          : record.fileLampiran ?? undefined,
      };

      return this.prisma.$transaction(async (tx) => {
        const updatedRecord = await tx.suratPerubahanKependudukan.update({
          where: { id },
          data: updatedData,
        });
        return updatedRecord;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat Surat Perubahan Kependudukan tidak ditemukan');
      }

      throw new InternalServerErrorException('Gagal memperbarui data surat perubahan kependudukan');
    }
  }

  async remove(id: number, userId?: number) {
    try {
      const record = await this.prisma.suratPerubahanKependudukan.findFirstOrThrow({ where: { id } });

      if (userId && record.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan menghapus data ini.")

      await this.prisma.suratPerubahanKependudukan.delete({ where: { id } });

      await Promise.all([
        deleteFileFromDisk(record.filePerubahan),
        deleteFileFromDisk(record.fileKk),
        record.fileLampiran ? deleteFileFromDisk(record.fileLampiran) : Promise.resolve(),
      ]);

      return {
        success: true,
        message: 'Surat Surat Perubahan Kependudukan berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat perubahan kependudukan tidak ditemukan');
      }
      console.error(error);
      throw new InternalServerErrorException('Gagal menghapus Surat Surat Perubahan Kependudukan');
    }
  }
}
