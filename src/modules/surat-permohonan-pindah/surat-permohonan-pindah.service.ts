import { ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FieldConflictException } from '@/common/utils/fieldConflictException';
import { deleteFileFromDisk, handleUploadAndUpdate } from '@/common/utils/file';
import { CreateDto, FindAllSuratPermohonanPindahDto, UpdateDto } from './dto/surat-permohonan-pindah.dto';

@Injectable()
export class SuratPermohonanPindahService {
  private readonly UPLOAD_PATH = 'surat-permohonan-pindah';

  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto, files: { [key: string]: Express.Multer.File[] }, userId: number) {
    try {
      const checkNIK = await this.prisma.suratPermohonanPindah.findUnique({
        where: { nik: data.nik },
      });
      if (checkNIK) {
        throw new FieldConflictException('nik', 'Surat Surat Permohonan Pindah dengan nik tersebut sudah ada di arsip');
      }

      const finalData = {
        ...data,
        createdById: userId,
        filePmhnPindah: `${this.UPLOAD_PATH}/${files.filePmhnPindah![0].filename}`,
        fileKk: `${this.UPLOAD_PATH}/${files.fileKk![0].filename}`,
        fileLampiran: files.fileLampiran?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileLampiran[0].filename}`
          : null,
      };
      return this.prisma.suratPermohonanPindah.create({ data: finalData });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal menambahkan surat permohonan pindah baru');
    }
  }

  async findAll(dto: FindAllSuratPermohonanPindahDto, userId?: number) {
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
      this.prisma.suratPermohonanPindah.count({ where }),
      this.prisma.suratPermohonanPindah.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      success: true,
      message: 'Daftar Surat Surat Permohonan Pindah berhasil diambil',
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
      const data = await this.prisma.suratPermohonanPindah.findFirstOrThrow({
        where: { id }
      });

      if (userId && data.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan mengambil surat permohonan pindah ini.");

      return {
        message: 'Surat permohonan pindah berhasil diambil',
        data: data,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat Surat Permohonan Pindah tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data surat permohonan pindah');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
    userId?: number
  ) {
    try {
      const record = await this.prisma.suratPermohonanPindah.findFirstOrThrow({ where: { id } });
      if (userId && record.createdById !== userId) throw new ForbiddenException('Anda tidak diizinkan memperbarui surat ini.');

      const uploadSubfolder = this.UPLOAD_PATH;

      const updatedData = {
        ...data,
        filePmhnPindah: files.filePmhnPindah?.[0]
          ? await handleUploadAndUpdate({
            file: files.filePmhnPindah[0],
            oldFilePath: record.filePmhnPindah,
            uploadSubfolder,
          })
          : record.filePmhnPindah,
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
        const updatedRecord = await tx.suratPermohonanPindah.update({
          where: { id },
          data: updatedData,
        });
        return updatedRecord;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat Surat Permohonan Pindah tidak ditemukan');
      }

      throw new InternalServerErrorException('Gagal memperbarui data surat permohonan pindah');
    }
  }

  async remove(id: number, userId?: number) {
    try {
      const record = await this.prisma.suratPermohonanPindah.findFirstOrThrow({ where: { id } });

      if (userId && record.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan menghapus data ini.")

      await this.prisma.suratPermohonanPindah.delete({ where: { id } });

      await Promise.all([
        deleteFileFromDisk(record.filePmhnPindah),
        deleteFileFromDisk(record.fileKk),
        record.fileLampiran ? deleteFileFromDisk(record.fileLampiran) : Promise.resolve(),
      ]);

      return {
        success: true,
        message: 'Surat Surat Permohonan Pindah berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Surat permohonan pindah tidak ditemukan');
      }
      console.error(error);
      throw new InternalServerErrorException('Gagal menghapus Surat Surat Permohonan Pindah');
    }
  }
}
