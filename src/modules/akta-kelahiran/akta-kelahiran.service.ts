import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDto, FindAllAktaDto, UpdateDto } from './dto/akta-kelahiran.dto';
import { FieldConflictException } from '@/common/utils/fieldConflictException';
import { deleteFileFromDisk, handleUploadAndUpdate } from '@/common/utils/file';

@Injectable()
export class AktaKelahiranService {
  private readonly UPLOAD_PATH = 'akta-kelahiran';

  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto, files: { [key: string]: Express.Multer.File[] }) {
    try {
      const checkNIK = await this.prisma.aktaKelahiran.findUnique({
        where: { nik: data.nik },
      });
      if (checkNIK) {
        throw new FieldConflictException('nik', 'Akta Kelahiran dengan nik tersebut sudah ada di arsip');
      }

      const finalData = {
        ...data,
        fileSuratKelahiran: `${this.UPLOAD_PATH}/${files.fileSuratKelahiran![0].filename}`,
        fileKk: `${this.UPLOAD_PATH}/${files.fileKk![0].filename}`,
        fileSuratNikah: `${this.UPLOAD_PATH}/${files.fileSuratNikah![0].filename}`,
        fileSPTJMKelahiran: `${this.UPLOAD_PATH}/${files.fileSPTJMKelahiran![0].filename}`,
        fileSPTJMPernikahan: `${this.UPLOAD_PATH}/${files.fileSPTJMPernikahan![0].filename}`,
        fileLampiran: files.fileLampiran?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileLampiran[0].filename}`
          : null,
      };
      return this.prisma.aktaKelahiran.create({ data: finalData });

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
      this.prisma.aktaKelahiran.count({ where }),
      this.prisma.aktaKelahiran.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    // --- Kembalikan response standar ---
    return {
      success: true,
      message: 'Daftar Akta Kelahiran berhasil diambil',
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
      const data = await this.prisma.aktaKelahiran.findFirstOrThrow({
        where: { id }
      });

      return {
        message: 'Akta kelahiran berhasil diambil',
        data: data,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta Kelahiran tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data akte kelahiran');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
  ) {
    const record = await this.prisma.aktaKelahiran.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Akta Kelahiran tidak ditemukan');

    const uploadSubfolder = this.UPLOAD_PATH;

    const updatedData = {
      ...data,
      fileSuratKelahiran: files.fileSuratKelahiran?.[0]
        ? await handleUploadAndUpdate({
          file: files.fileSuratKelahiran[0],
          oldFilePath: record.fileSuratKelahiran,
          uploadSubfolder,
        })
        : record.fileSuratKelahiran,
      fileKk: files.fileKk?.[0]
        ? await handleUploadAndUpdate({
          file: files.fileKk[0],
          oldFilePath: record.fileKk,
          uploadSubfolder,
        })
        : record.fileKk,
      fileSuratNikah: files.fileSuratNikah?.[0]
        ? await handleUploadAndUpdate({
          file: files.fileSuratNikah[0],
          oldFilePath: record.fileSuratNikah,
          uploadSubfolder,
        })
        : record.fileSuratNikah,
      fileSPTJMKelahiran: files.fileSPTJMKelahiran?.[0]
        ? await handleUploadAndUpdate({
          file: files.fileSPTJMKelahiran[0],
          oldFilePath: record.fileSPTJMKelahiran,
          uploadSubfolder,
        })
        : record.fileSPTJMKelahiran,
      fileSPTJMPernikahan: files.fileSPTJMPernikahan?.[0]
        ? await handleUploadAndUpdate({
          file: files.fileSPTJMPernikahan[0],
          oldFilePath: record.fileSPTJMPernikahan,
          uploadSubfolder,
        })
        : record.fileSPTJMPernikahan,
      fileLampiran: files.fileLampiran?.[0]
        ? await handleUploadAndUpdate({
          file: files.fileLampiran[0],
          oldFilePath: record.fileLampiran ?? undefined,
          uploadSubfolder,
        })
        : record.fileLampiran ?? undefined,
    };

    return this.prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.aktaKelahiran.update({
        where: { id },
        data: updatedData,
      });
      return updatedRecord;
    });
  }

  async remove(id: number) {
    const record = await this.prisma.aktaKelahiran.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Akta Kelahiran tidak ditemukan');

    try {
      await this.prisma.aktaKelahiran.delete({ where: { id } });

      await Promise.all([
        deleteFileFromDisk(record.fileSuratKelahiran),
        deleteFileFromDisk(record.fileKk),
        deleteFileFromDisk(record.fileSuratNikah),
        deleteFileFromDisk(record.fileSPTJMKelahiran),
        deleteFileFromDisk(record.fileSPTJMPernikahan),
        record.fileLampiran ? deleteFileFromDisk(record.fileLampiran) : Promise.resolve(),
      ]);

      return {
        success: true,
        message: 'Akta Kelahiran berhasil dihapus',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Gagal menghapus Akta Kelahiran');
    }
  }
}
