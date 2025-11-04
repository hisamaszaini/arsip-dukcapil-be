import { ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDto, FindAllAktaDto, UpdateDto } from './dto/akta-kematian.dto';
import { FieldConflictException } from '@/common/utils/fieldConflictException';
import { deleteFileFromDisk, handleUploadAndUpdate } from '@/common/utils/file';

@Injectable()
export class AktaKematianService {
  private readonly UPLOAD_PATH = 'akta-kematian';

  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto, files: { [key: string]: Express.Multer.File[] }, userId: number) {
    try {
      const checkNIK = await this.prisma.aktaKematian.findUnique({
        where: { noAkta: data.noAkta },
      });
      if (checkNIK) {
        throw new FieldConflictException('noAkta', 'Akta Kematian dengan Nomor Akta tersebut sudah ada di arsip');
      }

      const finalData = {
        ...data,
        createdById: userId,
        fileSuratKematian: `${this.UPLOAD_PATH}/${files.fileSuratKematian![0].filename}`,
        fileKk: `${this.UPLOAD_PATH}/${files.fileKk![0].filename}`,
        fileLampiran: files.fileLampiran?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileLampiran[0].filename}`
          : null,
        fileRegister: files.fileRegister?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileRegister[0].filename}`
          : null,
        fileLaporan: files.fileLaporan?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileLaporan[0].filename}`
          : null,
        fileSPTJM: files.fileSPTJM?.[0]
          ? `${this.UPLOAD_PATH}/${files.fileSPTJM[0].filename}`
          : null,
      };
      return this.prisma.aktaKematian.create({ data: finalData });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal menambahkan akta kematian baru');
    }
  }

  async findAll(dto: FindAllAktaDto, userId?: number) {
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

  async findOne(id: number, userId?: number) {
    try {
      const data = await this.prisma.aktaKematian.findFirstOrThrow({
        where: { id }
      });

      if (userId && data.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan mengambil akta kematian ini.");

      return {
        message: 'Akta kematian berhasil diambil',
        data: data,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta Kematian tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data akta kematian');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
    userId?: number
  ) {
    try {
      const record = await this.prisma.aktaKematian.findFirstOrThrow({ where: { id } });
      if (userId && record.createdById !== userId) throw new ForbiddenException('Anda tidak diizinkan memperbarui akta ini.');

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
        fileRegister: files.fileRegister?.[0]
          ? await handleUploadAndUpdate({
            file: files.fileRegister[0],
            oldFilePath: record.fileRegister ?? undefined,
            uploadSubfolder,
          })
          : record.fileRegister ?? undefined,
        fileLaporan: files.fileLaporan?.[0]
          ? await handleUploadAndUpdate({
            file: files.fileLaporan[0],
            oldFilePath: record.fileLaporan ?? undefined,
            uploadSubfolder,
          })
          : record.fileLaporan ?? undefined,
        fileSPTJM: files.fileSPTJM?.[0]
          ? await handleUploadAndUpdate({
            file: files.fileSPTJM[0],
            oldFilePath: record.fileSPTJM ?? undefined,
            uploadSubfolder,
          })
          : record.fileSPTJM ?? undefined,
      };

      return this.prisma.$transaction(async (tx) => {
        const updatedRecord = await tx.aktaKematian.update({
          where: { id },
          data: updatedData,
        });
        return updatedRecord;
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta Kematian tidak ditemukan');
      }

      throw new InternalServerErrorException('Gagal memperbarui data akta kelahiran');
    }
  }

  async remove(id: number, userId?: number) {
    try {
      const record = await this.prisma.aktaKematian.findFirstOrThrow({ where: { id } });

      if (userId && record.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan menghapus data ini.")

      await this.prisma.aktaKematian.delete({ where: { id } });

      await Promise.all([
        deleteFileFromDisk(record.fileSuratKematian),
        deleteFileFromDisk(record.fileKk),
        record.fileLampiran ? deleteFileFromDisk(record.fileLampiran) : Promise.resolve(),
        record.fileRegister ? deleteFileFromDisk(record.fileRegister) : Promise.resolve(),
        record.fileLaporan ? deleteFileFromDisk(record.fileLaporan) : Promise.resolve(),
        record.fileSPTJM ? deleteFileFromDisk(record.fileSPTJM) : Promise.resolve(),
      ]);

      return {
        success: true,
        message: 'Akta Kematian berhasil dihapus',
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta kematian tidak ditemukan');
      }
      console.error(error);
      throw new InternalServerErrorException('Gagal menghapus Akta Kematian');
    }
  }
}
