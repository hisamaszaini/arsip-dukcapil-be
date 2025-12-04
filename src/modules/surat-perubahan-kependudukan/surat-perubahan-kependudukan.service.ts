import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateDto,
  FindAllSuratPerubahanKependudukanDto,
  UpdateDto,
} from './dto/surat-perubahan-kependudukan.dto';
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
export class SuratPerubahanKependudukanService {
  private readonly UPLOAD_PATH = 'surat-perubahan-kependudukan';

  constructor(private prisma: PrismaService) {}

  async create(data: CreateDto, files: Express.Multer.File[], userId: number) {
    if (!files?.length) {
      throw new BadRequestException('Minimal satu file wajib diunggah.');
    }

    const nikEnc = JSON.stringify(encryptValue(data.nik));
    const nikHash = hashDeterministic(data.nik);

    try {
      const fileRecords: Prisma.ArsipFileCreateWithoutSuratPerKpnInput[] = [];

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

      const newRecord = await this.prisma.suratPerubahanKependudukan.create({
        data: {
          nik: data.nik,
          nikEnc: nikEnc,
          nikHash: nikHash,
          noFisik: data.noFisik,
          createdBy: { connect: { id: userId } },
          arsipFiles: { create: fileRecords },
        },
        include: { arsipFiles: true },
      });

      const cleaned = autoDecryptAndClean(newRecord);

      return createdResponse('Surat Perubahan Kependudukan', cleaned);
    } catch (error) {
      handleCreateError(error, 'Surat Perubahan Kependudukan');
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
        { noFisik: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.suratPerubahanKependudukan.count({ where }),
      this.prisma.suratPerubahanKependudukan.findMany({
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

    // --- Kembalikan response standar ---
    return listResponse('Surat Perubahan Kependudukan', cleaned, meta);
  }

  async findOne(id: number, userId?: number) {
    try {
      const data =
        await this.prisma.suratPerubahanKependudukan.findFirstOrThrow({
          where: { id },
          include: { arsipFiles: { orderBy: { id: 'asc' } } },
        });

      if (userId && data.createdById !== userId)
        throw new ForbiddenException(
          'Anda tidak diizinkan mengambil surat perubahan-kependudukan ini.',
        );

      const cleaned = autoDecryptAndClean(data);

      return foundResponse('Surat Perubahan Kependudukan', cleaned);
    } catch (error) {
      handleFindError(error, 'Surat Perubahan Kependudukan');
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
      const record =
        await this.prisma.suratPerubahanKependudukan.findUniqueOrThrow({
          where: { id },
          include: { arsipFiles: { orderBy: { id: 'asc' } } },
        });

      if (!isAdmin && record.createdById !== userId) {
        throw new ForbiddenException(
          'Anda tidak diizinkan memperbarui surat ini.',
        );
      }

      // Cek apakah nik berubah
      let nikEnc = record.nikEnc;
      let nikHash = record.nikHash;
      let newNik = record.nik;

      if (data.nik && data.nik !== record.nik) {
        // Nilai berubah → generate baru
        newNik = data.nik;
        nikEnc = JSON.stringify(encryptValue(data.nik));
        nikHash = hashDeterministic(data.nik);
      }

      // --- Transaksi aman ---
      return await this.prisma.$transaction(async (tx) => {
        // Update data utama terlebih dahulu
        const updatedSurat = await tx.suratPerubahanKependudukan.update({
          where: { id },
          data: {
            nik: data.nik ?? record.nik,
            nikEnc: nikEnc,
            nikHash: nikHash,
            noFisik: data.noFisik ?? record.noFisik,
          },
        });

        const cleaned = autoDecryptAndClean(updatedSurat);

        const uploadSubfolder = this.UPLOAD_PATH;

        // Jika tidak ada file dikirim, hanya update data utama
        if (!files || files.length === 0) {
          return {
            success: true,
            message: 'Data surat perubahan kependudukan berhasil diperbarui',
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
                  suratPerKpn: { connect: { id } },
                },
              });
            }
          }

          // Ambil data terbaru setelah semua update dan penambahan file
          const refreshed = await tx.suratPerubahanKependudukan.findUnique({
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
                suratPerKpn: { connect: { id } },
              },
            });
          }

          const refreshed = await tx.suratPerubahanKependudukan.findUnique({
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
          message: 'Data surat perubahan kependudukan berhasil diperbarui',
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
      handleUpdateError(error, 'Surat Perubahan Kependudukan');
    }
  }

  async removeFile(fileId: number, userId?: number) {
    try {
      // Ambil file yang ingin dihapus beserta relasi suratPerubahanKependudukan
      const file = await this.prisma.arsipFile.findUniqueOrThrow({
        where: { id: fileId },
        include: {
          suratPerKpn: {
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

      if (!file.suratPerKpn) {
        throw new BadRequestException(
          'File tidak memiliki relasi surat perubahan-kependudukan',
        );
      }

      // Cek apakah user berhak menghapus file
      if (userId && file.suratPerKpn.createdById !== userId) {
        throw new ForbiddenException(
          'Anda tidak memiliki izin untuk menghapus file ini',
        );
      }

      // Cek jumlah file yang dimiliki suratPerubahanKependudukan
      const totalFiles = file.suratPerKpn.arsipFiles.length;
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
      handleDeleteError(error, 'File surat perubahan-kependudukan');
    }
  }

  async remove(id: number, userId?: number) {
    try {
      const record =
        await this.prisma.suratPerubahanKependudukan.findUniqueOrThrow({
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
          where: { suratPerKpnId: id },
        });

        await tx.suratPerubahanKependudukan.delete({
          where: { id },
        });
      });

      if (record.arsipFiles.length > 0) {
        await Promise.all(
          record.arsipFiles.map((file) => deleteFileFromDisk(file.path)),
        );
      }

      return deletedResponse('Surat Perubahan Kependudukan');
    } catch (error) {
      handleDeleteError(error, 'Surat Perubahan Kependudukan');
    }
  }
}
