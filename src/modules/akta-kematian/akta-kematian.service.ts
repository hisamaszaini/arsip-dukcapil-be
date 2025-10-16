import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDto, FindAllAktaDto, UpdateDto } from './dto/akta-kematian.dto';
import { FieldConflictException } from '@/common/utils/fieldConflictException';
import { deleteFileFromDisk, handleUploadAndUpdate } from '@/common/utils/file';

@Injectable()
export class AktaKematianService {
  private readonly UPLOAD_PATH = 'akta-kematian';

  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto, files: { [key: string]: Express.Multer.File[] }) {
    try {
      const checkNIK = await this.prisma.aktaKematian.findUnique({
        where: { nik: data.nik },
      });
      if (checkNIK) {
        throw new FieldConflictException('nik', 'Akta Kematian dengan nik tersebut sudah ada di arsip');
      }

      const finalData = {
        ...data,
        fileSuratKematian: `${this.UPLOAD_PATH}/${files.fileSuratKematian![0].filename}`,
        fileKk: `${this.UPLOAD_PATH}/${files.fileKk![0].filename}`,
        fileLampiran: files.fileLampiran?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileLampiran[0].filename}`
          : null,
      };
      return this.prisma.aktaKematian.create({ data: finalData });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal membuat akun baru');
    }
  }

  async findAll(dto: FindAllAktaDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'asc',
    } = dto;

    const where: any = {};
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.aktaKematian.count({ where }),
      this.prisma.aktaKematian.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    // --- Kembalikan response standar ---
    return {
      success: true,
      message: 'Daftar Akta Kematian berhasil diambil',
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
      const data = await this.prisma.aktaKematian.findFirstOrThrow({
        where: { id }
      });

      return {
        message: 'Akta kematian berhasil diambil',
        data: data,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta Kematian tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data akte kematian');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
  ) {
    const record = await this.prisma.aktaKematian.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Akta Kematian tidak ditemukan');

    const uploadSubfolder = this.UPLOAD_PATH;

    const updatedData = {
      ...data,
      fileSuratKematian: files.fileSuratKematian?.[0]
        ? await handleUploadAndUpdate({
          file: files.fileSuratKematian[0],
          oldFilePath: record.fileSuratKematian,
          uploadSubfolder,
        })
        : record.fileSuratKematian,
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
      const updatedRecord = await tx.aktaKematian.update({
        where: { id },
        data: updatedData,
      });
      return updatedRecord;
    });
  }

  async remove(id: number) {
    const record = await this.prisma.aktaKematian.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Akta Kematian tidak ditemukan');

    try {
      await this.prisma.aktaKematian.delete({ where: { id } });

      await Promise.all([
        deleteFileFromDisk(record.fileSuratKematian),
        deleteFileFromDisk(record.fileKk),
        record.fileLampiran ? deleteFileFromDisk(record.fileLampiran) : Promise.resolve(),
      ]);

      return {
        success: true,
        message: 'Akta Kematian berhasil dihapus',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Gagal menghapus Akta Kematian');
    }
  }
}
