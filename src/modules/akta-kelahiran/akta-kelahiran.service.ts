import { BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDto, FindAllAktaDto, UpdateDto } from './dto/akta-kelahiran.dto';
import { deleteFileFromDisk, handleUploadAndUpdate } from '@/common/utils/file';
import { FieldConflictException } from '@/common/utils/fieldConflictException';

@Injectable()
export class AktaKelahiranService {
  private readonly UPLOAD_PATH = 'akta-kelahiran';

  constructor(private prisma: PrismaService) { }

  // async create(
  //   data: CreateDto,
  //   files: { [key: string]: Express.Multer.File[] },
  //   userId: number,
  // ) {
  //   try {
  //     const checkNIK = await this.prisma.aktaKelahiran.findUnique({
  //       where: { noAkta: data.noAkta },
  //     });
  //     if (checkNIK) throw new BadRequestException('Akta Kelahiran dengan NIK tersebut sudah ada');

  //     const finalFiles: Array<{ key: string; name: string; url: string }> = [];

  //     for (let i = 1; i <= 6; i++) {
  //       const key = `file${i}`;
  //       const file = files[key]?.[0];

  //       if (file) {
  //         finalFiles.push({
  //           key,
  //           name: file.originalname,
  //           url: `${this.UPLOAD_PATH}/${file.filename}`,
  //         });
  //       } else if (i <= 5) {
  //         throw new BadRequestException(`File ${key} wajib diunggah`);
  //       }
  //     }

  //     return this.prisma.aktaKelahiran.create({
  //       data: {
  //         ...data,
  //         createdById: userId,
  //         files: finalFiles,
  //       },
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     throw new InternalServerErrorException('Gagal menambahkan akta kelahiran baru');
  //   }
  // }

  async create(data: CreateDto, files: { [key: string]: Express.Multer.File[] }, userId: number) {
    try {
      const checkNIK = await this.prisma.aktaKelahiran.findUnique({
        where: { noAkta: data.noAkta },
      });
      if (checkNIK) {
        throw new FieldConflictException('noAkta', 'Nomor Akta Kelahiran  sudah ada di arsip');
      }

      const finalData = {
        ...data,
        createdById: userId,
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
      throw new InternalServerErrorException('Gagal menambahkan akta kelahiran baru');
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

  async findOne(id: number, userId?: number) {
    try {
      const data = await this.prisma.aktaKelahiran.findFirstOrThrow({
        where: { id }
      });

      if (userId && data.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan mengambil akta kelahiran ini.");

      return {
        message: 'Akta kelahiran berhasil diambil',
        data: data,
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta Kelahiran tidak ditemukan');
      }
      throw new InternalServerErrorException('Gagal mengambil data akta kelahiran');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
    userId?: number
  ) {
    try {
      const record = await this.prisma.aktaKelahiran.findFirstOrThrow({ where: { id } });
      if (userId && record.createdById !== userId) throw new ForbiddenException('Anda tidak diizinkan memperbarui akta ini.');

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
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta Kelahiran tidak ditemukan');
      }

      throw new InternalServerErrorException('Gagal memperbarui data akta kelahiran');
    }
  }

  // async update(
  //   id: number,
  //   data: UpdateDto,
  //   files: { [key: string]: Express.Multer.File[] },
  //   userId?: number,
  // ) {
  //   try {
  //     const record = await this.prisma.aktaKelahiran.findFirstOrThrow({ where: { id } });
  //     if (userId && record.createdById !== userId)
  //       throw new ForbiddenException('Anda tidak diizinkan memperbarui akta ini.');

  //     const uploadSubfolder = this.UPLOAD_PATH;
  //     const filesArray = record.files as Array<{ key: string; name: string; url: string }> || [];

  //     // Loop file1–file6
  //     for (let i = 1; i <= 6; i++) {
  //       const key = `file${i}`;
  //       const newFile = files[key]?.[0];
  //       if (newFile) {
  //         const existingIndex = filesArray.findIndex(f => f.key === key);

  //         const newFilePath = await handleUploadAndUpdate({
  //           file: newFile,
  //           oldFilePath: filesArray[existingIndex]?.url,
  //           uploadSubfolder,
  //         });

  //         const fileObj = { key, name: newFile.originalname, url: newFilePath };

  //         if (existingIndex > -1) {
  //           filesArray[existingIndex] = fileObj;
  //         } else {
  //           filesArray.push(fileObj);
  //         }
  //       }
  //     }

  //     const updatedData = {
  //       ...data,
  //       files: filesArray,
  //     };

  //     return this.prisma.aktaKelahiran.update({
  //       where: { id },
  //       data: updatedData,
  //     });
  //   } catch (error: any) {
  //     if (error.code === 'P2025') throw new NotFoundException('Akta Kelahiran tidak ditemukan');
  //     console.error(error);
  //     throw new InternalServerErrorException('Gagal memperbarui data akta kelahiran');
  //   }
  // }

  // async remove(id: number, userId?: number) {
  //   try {
  //     const record = await this.prisma.aktaKelahiran.findFirstOrThrow({
  //       where: { id },
  //     });

  //     if (userId && record.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan menghapus data ini.")

  //     await this.prisma.aktaKelahiran.delete({ where: { id } });

  //     await Promise.all([
  //       deleteFileFromDisk(record.fileSuratKelahiran),
  //       deleteFileFromDisk(record.fileKk),
  //       deleteFileFromDisk(record.fileSuratNikah),
  //       deleteFileFromDisk(record.fileSPTJMKelahiran),
  //       deleteFileFromDisk(record.fileSPTJMPernikahan),
  //       record.fileLampiran ? deleteFileFromDisk(record.fileLampiran) : Promise.resolve(),
  //     ]);

  //     return {
  //       success: true,
  //       message: 'Akta Kelahiran berhasil dihapus',
  //     };
  //   } catch (error) {
  //     if (error.code === 'P2025') {
  //       throw new NotFoundException('Akta Kelahiran tidak ditemukan');
  //     }

  //     console.error('[AktaKelahiranService.remove]', error);
  //     throw new InternalServerErrorException('Gagal menghapus Akta Kelahiran');
  //   }
  // }

  async remove(id: number, userId?: number) {
    try {
      const record = await this.prisma.aktaKelahiran.findFirstOrThrow({
        where: { id },
      });

      if (userId && record.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan menghapus data ini.")

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
      if (error.code === 'P2025') {
        throw new NotFoundException('Akta Kelahiran tidak ditemukan');
      }

      console.error('[AktaKelahiranService.remove]', error);
      throw new InternalServerErrorException('Gagal menghapus Akta Kelahiran');
    }
  }

  // async remove(id: number, userId?: number) {
  //   try {
  //     const record = await this.prisma.aktaKelahiran.findFirstOrThrow({ where: { id } });

  //     if (userId && record.createdById !== userId)
  //       throw new ForbiddenException("Anda tidak diizinkan menghapus data ini.");

  //     await this.prisma.aktaKelahiran.delete({ where: { id } });

  //     const filesArray = record.files as Array<{ key: string; name: string; url: string }> || [];

  //     await Promise.all(
  //       filesArray.map(file => deleteFileFromDisk(file.url))
  //     );

  //     return {
  //       success: true,
  //       message: 'Akta Kelahiran berhasil dihapus',
  //     };
  //   } catch (error: any) {
  //     if (error.code === 'P2025') throw new NotFoundException('Akta Kelahiran tidak ditemukan');

  //     console.error('[AktaKelahiranService.remove]', error);
  //     throw new InternalServerErrorException('Gagal menghapus Akta Kelahiran');
  //   }
  // }

  // async deleteSatuBerkas(id: number, fileKey: string, userId?: number) {
  //   try {
  //     const record = await this.prisma.aktaKelahiran.findFirstOrThrow({
  //       where: { id },
  //     });

  //     if (userId && record.createdById !== userId) {
  //       throw new ForbiddenException("Anda tidak diizinkan mengubah data ini.");
  //     }

  //     const files = (record.files as Record<string, string>) || {};
  //     const pathToDelete = files[fileKey];

  //     if (!pathToDelete) {
  //       return {
  //         success: true,
  //         message: 'File tidak ditemukan atau sudah dihapus',
  //       };
  //     }

  //     await deleteFileFromDisk(pathToDelete);
  //     delete files[fileKey];

  //     await this.prisma.aktaKelahiran.update({
  //       where: { id: record.id },
  //       data: {
  //         files: files as any,
  //       },
  //     });

  //     return {
  //       success: true,
  //       message: `Berkas '${fileKey}' berhasil dihapus`,
  //     };

  //   } catch (error) {
  //     if (error.code === 'P2025') {
  //       throw new NotFoundException('Akta Kelahiran tidak ditemukan');
  //     }

  //     if (error instanceof ForbiddenException) {
  //       throw error;
  //     }

  //     console.error('[AktaKelahiranService.deleteSatuBerkas]', error);
  //     throw new InternalServerErrorException('Gagal menghapus berkas');
  //   }
  // }
}
