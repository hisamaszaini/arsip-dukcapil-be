import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDto, FindAllAktaDto, UpdateDto } from './dto/akta-kelahiran.dto';
import {
  deleteFileFromDisk,
  handleUpload,
  handleUploadAndUpdate,
} from '@/common/utils/file';
import {
  handleCreateError,
  handleDeleteError,
  handleFindError,
  handleUpdateError,
} from '@/common/utils/handle-prisma-error';
import { Prisma } from '@prisma/client';
import {
  autoDecryptAndClean,
  encryptValue,
  hashDeterministic,
} from '@/common/utils/EncDecHas';
import {
  createdResponse,
  deletedResponse,
  foundResponse,
  listResponse,
} from '@/common/utils/success-helper';

@Injectable()
export class AktaKelahiranService {
  private readonly UPLOAD_PATH = 'akta-kelahiran';

  constructor(private prisma: PrismaService) {}

  async create(data: CreateDto, files: Express.Multer.File[], userId: number) {
    if (!files?.length) {
      throw new BadRequestException('Minimal satu file wajib diunggah.');
    }

    try {
      const fileRecords: Prisma.ArsipFileCreateWithoutAktaKelahiranInput[] = [];

      for (const file of files) {
        const relativePath = await handleUpload({
          file,
          uploadSubfolder: this.UPLOAD_PATH,
        });

        fileRecords.push({
          originalName: file.originalname,
          path: relativePath,
          uploadBy: { connect: { id: userId } },
        });
      }

      const noAktaEnc = JSON.stringify(encryptValue(data.noAkta));
      const noAktaHash = hashDeterministic(data.noAkta);

      const newRecord = await this.prisma.aktaKelahiran.create({
        data: {
          noAkta: data.noAkta,
          noAktaEnc: noAktaEnc,
          noAktaHash: noAktaHash,
          noFisik: data.noFisik,
          createdBy: { connect: { id: userId } },
          arsipFiles: { create: fileRecords },
        },
        include: { arsipFiles: true },
      });

      const cleaned = autoDecryptAndClean(newRecord);

      return createdResponse('Akta Kelahiran', cleaned);
    } catch (error) {
      handleCreateError(error, 'Akta Kelahiran');
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
        { noFisik: { contains: search, mode: 'insensitive' } },
        { noAkta: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.aktaKelahiran.count({ where }),
      this.prisma.aktaKelahiran.findMany({
        where,
        include: { arsipFiles: { orderBy: { id: 'asc' } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const cleaned = autoDecryptAndClean(data);
    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return listResponse('Akta Kelahiran', cleaned, meta);
  }

  async findOne(id: number, userId?: number) {
    try {
      const data = await this.prisma.aktaKelahiran.findFirstOrThrow({
        where: { id },
        include: { arsipFiles: { orderBy: { id: 'asc' } } },
      });

      if (userId && data.createdById !== userId)
        throw new ForbiddenException(
          'Anda tidak diizinkan mengambil akta kelahiran ini.',
        );

      const cleaned = autoDecryptAndClean(data);

      return foundResponse('Akta Kelahiran', cleaned);
    } catch (error) {
      handleFindError(error, 'Akta Kelahiran');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: Express.Multer.File[],
    userId: number,
    isAdmin?: boolean,
  ) {
    try {
      // --- Validasi record dulu ---
      const record = await this.prisma.aktaKelahiran.findUniqueOrThrow({
        where: { id },
        include: { arsipFiles: { orderBy: { id: 'asc' } } },
      });

      if (!isAdmin && record.createdById !== userId) {
        throw new ForbiddenException(
          'Anda tidak diizinkan memperbarui akta ini.',
        );
      }

      // Cek apakah noAkta berubah
      let noAktaEnc = record.noAktaEnc;
      let noAktaHash = record.noAktaHash;
      let newNoAkta = record.noAkta;

      if (data.noAkta && data.noAkta !== record.noAkta) {
        // Nilai berubah → generate baru
        newNoAkta = data.noAkta;
        noAktaEnc = JSON.stringify(encryptValue(data.noAkta));
        noAktaHash = hashDeterministic(data.noAkta);
      }

      // --- Transaksi aman ---
      return await this.prisma.$transaction(async (tx) => {
        // Update data utama terlebih dahulu
        const updatedAkta = await tx.aktaKelahiran.update({
          where: { id },
          data: {
            noAkta: data.noAkta ?? record.noAkta,
            noAktaEnc: noAktaEnc,
            noAktaHash: noAktaHash,
            noFisik: data.noFisik ?? record.noFisik,
          },
        });

        const cleaned = autoDecryptAndClean(updatedAkta);

        const uploadSubfolder = this.UPLOAD_PATH;

        // Jika tidak ada file dikirim, hanya update data utama
        if (!files || files.length === 0) {
          return {
            success: true,
            message: 'Data akta kelahiran berhasil diperbarui',
            data: cleaned,
          };
        }

        // --- Ambil daftar fileIds dari body ---
        const fileIds = Array.isArray(data.fileIds)
          ? data.fileIds.map((id) => Number(id))
          : [];

        const replaceCount = Math.min(fileIds.length, files.length);

        // === MODE 1 — Replace file lama berdasarkan fileIds[] ===
        if (fileIds.length > 0 && files.length > 0) {
          for (let i = 0; i < replaceCount; i++) {
            const fileId = Number(fileIds[i]);
            const newFile = files[i];
            if (!newFile) continue;

            const oldFile = await tx.arsipFile.findUnique({
              where: { id: fileId },
            });
            if (!oldFile) {
              throw new BadRequestException(
                `File dengan ID ${fileId} tidak ditemukan`,
              );
            }

            // Upload file baru dan hapus file lama dari disk menggunakan helper
            const newPath = await handleUploadAndUpdate({
              file: newFile,
              oldFilePath: oldFile.path,
              uploadSubfolder,
            });

            // Update record file di database
            await tx.arsipFile.update({
              where: { id: fileId },
              data: {
                originalName: newFile.originalname,
                path: newPath,
                uploadBy: { connect: { id: userId } },
              },
            });
          }

          // === MODE 1.5 — Tambah file baru jika ada sisa file tanpa fileId ===
          const newFiles = files.slice(replaceCount);
          if (newFiles.length > 0) {
            for (const newFile of newFiles) {
              const relativePath = await handleUpload({
                file: newFile,
                uploadSubfolder,
              });

              await tx.arsipFile.create({
                data: {
                  originalName: newFile.originalname,
                  path: relativePath,
                  uploadBy: { connect: { id: userId } },
                  aktaKelahiran: { connect: { id } },
                },
              });
            }
          }

          // Ambil data terbaru setelah semua update dan penambahan file
          const refreshed = await tx.aktaKelahiran.findUnique({
            where: { id },
            include: { arsipFiles: { orderBy: { id: 'asc' } } },
          });

          const cleaned = autoDecryptAndClean(refreshed);

          return {
            success: true,
            message:
              newFiles.length > 0
                ? 'File berhasil diganti dan file baru ditambahkan'
                : 'File berhasil diganti',
            data: cleaned,
          };
        }

        // === MODE 2 — Tambah file baru tanpa fileIds ===
        if ((!data.fileIds || data.fileIds.length === 0) && files.length > 0) {
          for (const newFile of files) {
            const relativePath = await handleUpload({
              file: newFile,
              uploadSubfolder,
            });

            await tx.arsipFile.create({
              data: {
                originalName: newFile.originalname,
                path: relativePath,
                uploadBy: { connect: { id: userId } },
                aktaKelahiran: { connect: { id } },
              },
            });
          }

          const refreshed = await tx.aktaKelahiran.findUnique({
            where: { id },
            include: { arsipFiles: { orderBy: { id: 'asc' } } },
          });

          const cleaned = autoDecryptAndClean(refreshed);

          return {
            success: true,
            message: 'File baru berhasil ditambahkan',
            data: cleaned,
          };
        }

        // === MODE 3 — Tidak ada file baru ===
        return {
          success: true,
          message: 'Data akta kelahiran berhasil diperbarui',
          data: cleaned,
        };
      });
    } catch (error) {
      // Bersihkan file sementara di disk jika transaksi gagal
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            await deleteFileFromDisk(file.path);
          } catch {
            /* abaikan jika file sudah tidak ada */
          }
        }
      }

      // Tangani error secara seragam
      handleUpdateError(error, 'Akta Kelahiran');
    }
  }

  async removeFile(fileId: number, userId?: number) {
    try {
      // Ambil file yang ingin dihapus beserta relasi aktaKelahiran
      const file = await this.prisma.arsipFile.findUniqueOrThrow({
        where: { id: fileId },
        include: {
          aktaKelahiran: {
            select: {
              id: true,
              createdById: true,
              arsipFiles: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!file.aktaKelahiran) {
        throw new BadRequestException(
          'File tidak memiliki relasi akta kelahiran',
        );
      }

      // Cek apakah user berhak menghapus file
      if (userId && file.aktaKelahiran.createdById !== userId) {
        throw new ForbiddenException(
          'Anda tidak memiliki izin untuk menghapus file ini',
        );
      }

      // Cek jumlah file yang dimiliki aktaKelahiran
      const totalFiles = file.aktaKelahiran.arsipFiles.length;
      if (totalFiles <= 1) {
        throw new BadRequestException(
          'Tidak dapat menghapus semua file, setidaknya harus ada 1 file tersisa.',
        );
      }

      // Hapus file dari disk
      await deleteFileFromDisk(file.path);

      // Hapus record di database
      await this.prisma.arsipFile.delete({
        where: { id: fileId },
      });

      return deletedResponse('File');
    } catch (error) {
      handleDeleteError(error, 'File akta kelahiran');
    }
  }

  async remove(id: number, userId?: number) {
    try {
      const record = await this.prisma.aktaKelahiran.findUniqueOrThrow({
        where: { id },
        include: { arsipFiles: true },
      });

      if (userId && record.createdById !== userId) {
        throw new ForbiddenException(
          'Anda tidak diizinkan menghapus data ini.',
        );
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.arsipFile.deleteMany({
          where: { aktaKelahiranId: id },
        });

        await tx.aktaKelahiran.delete({
          where: { id },
        });
      });

      if (record.arsipFiles.length > 0) {
        await Promise.all(
          record.arsipFiles.map((file) => deleteFileFromDisk(file.path)),
        );
      }

      return deletedResponse('Akta Kelahiran');
    } catch (error) {
      handleDeleteError(error, 'Akta Kelahiran');
    }
  }
}
