import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateArsipDto,
  FindAllArsipDto,
  UpdateArsipDto,
} from './dto/arsip.dto';
import {
  handleCreateError,
  handleDeleteError,
  handleFindError,
  handleUpdateError,
} from '@/common/utils/handle-prisma-error';
import { Prisma, NoType, UniqueConstraintType } from '@prisma/client';
import {
  handleUpload,
  deleteFileFromDisk,
  handleUploadAndUpdate,
} from '@/common/utils/file';
import {
  autoDecryptAndClean,
  encryptValue,
  hashDeterministic,
  encryptBuffer,
  decryptBuffer,
} from '@/common/utils/EncDecHas';
import {
  createdResponse,
  deletedResponse,
  foundResponse,
  listResponse,
  updatedResponse,
} from '@/common/utils/success-helper';
import { KategoriService } from '../kategori/kategori.service';

@Injectable()
export class ArsipService {
  private readonly UPLOAD_PATH = 'arsip';
  private readonly logger = new Logger(ArsipService.name);

  constructor(
    private prisma: PrismaService,
    private kategoriService: KategoriService,
  ) { }

  private async validateKategoriRules(
    kategoriId: number,
    data: Partial<CreateArsipDto> | Partial<UpdateArsipDto>,
    files: Express.Multer.File[],
    existingFileCount: number = 0,
    excludeArsipId?: number,
  ) {
    // Use cached service instead of direct prisma call
    const kategoriResponse = await this.kategoriService.findOne(kategoriId);
    const kategori = kategoriResponse.data;

    if (!kategori) {
      throw new BadRequestException(`Data kategori tidak ditemukan`);
    }

    const totalFiles = existingFileCount + files.length;
    if (totalFiles > kategori.maxFile) {
      throw new BadRequestException(
        `Maksimal file untuk kategori ${kategori.name} adalah ${kategori.maxFile}. Saat ini: ${existingFileCount}, Ditambah: ${files.length}`,
      );
    }

    if (kategori.rulesFormNama && !data.nama) {
      throw new BadRequestException(
        `Nama wajib diisi untuk kategori ${kategori.name}`,
      );
    }

    if (kategori.rulesFormTanggal && !data.tanggal) {
      throw new BadRequestException(
        `Tanggal wajib diisi untuk kategori ${kategori.name}`,
      );
    }

    // Dynamic Validation for 'no'
    if (data.no) {
      const no = data.no;

      // 1. Prefix Validation
      if (kategori.noPrefix && !no.startsWith(kategori.noPrefix)) {
        throw new BadRequestException(
          `Nomor harus diawali dengan prefix: ${kategori.noPrefix}`,
        );
      }

      // 2. Length Validation
      if (kategori.noMinLength && no.length < kategori.noMinLength) {
        throw new BadRequestException(
          `Nomor minimal ${kategori.noMinLength} karakter`,
        );
      }
      if (kategori.noMaxLength && no.length > kategori.noMaxLength) {
        throw new BadRequestException(
          `Nomor maksimal ${kategori.noMaxLength} karakter`,
        );
      }

      // 3. Type Validation
      if (kategori.noType === NoType.NUMERIC) {
        if (!/^[0-9\-\.\/]+$/.test(no)) {
          throw new BadRequestException(
            `Nomor harus berupa angka (dan pemisah standar)`,
          );
        }
      } else if (kategori.noType === NoType.ALPHANUMERIC) {
        if (!/^[a-zA-Z0-9\-\.\/]+$/.test(no)) {
          throw new BadRequestException(`Nomor harus berupa huruf dan angka`);
        }
      }

      // 4. Regex Validation (Most strict)
      if (kategori.noRegex) {
        try {
          const regex = new RegExp(kategori.noRegex);
          if (!regex.test(no)) {
            throw new BadRequestException(
              `Format nomor tidak sesuai. ${kategori.noFormat ? `Contoh: ${kategori.noFormat}` : ''}`,
            );
          }
        } catch (e) {
          console.error('Invalid regex in category config:', kategori.noRegex);
        }
      }

      // 5. Unique Constraint Validation
      if (kategori.uniqueConstraint !== UniqueConstraintType.NONE) {
        const where: Prisma.ArsipSemuaWhereInput = {
          idKategori: kategoriId,
          no: no,
        };

        if (excludeArsipId) {
          where.id = { not: excludeArsipId };
        }

        if (kategori.uniqueConstraint === UniqueConstraintType.NO_TANGGAL) {
          if (!data.tanggal) {
            // If updating and tanggal is not provided, we might need to fetch existing record's tanggal
            // But validateKategoriRules is called with mergedData in update(), so data.tanggal should be available if needed
            // However, if it's a create and tanggal is missing (but required by rulesFormTanggal), it would have failed earlier.
            // If rulesFormTanggal is false, tanggal might be null.
            // If uniqueConstraint is NO_TANGGAL, we assume tanggal is relevant.
            if (data.tanggal === undefined) {
              // Should not happen if merged correctly or required
            } else {
              where.tanggal = data.tanggal;
            }
          } else {
            where.tanggal = data.tanggal;
          }
        } else if (kategori.uniqueConstraint === UniqueConstraintType.NO_NOFISIK) {
          // Similar logic for noFisik. data.noFisik comes from CreateArsipDto which has noFisik as string
          if (data.noFisik) {
            where.noFisik = data.noFisik;
          }
        }

        // Only check if we have enough data to form the unique key
        let shouldCheck = true;
        if (
          kategori.uniqueConstraint === UniqueConstraintType.NO_TANGGAL &&
          !where.tanggal
        )
          shouldCheck = false;
        if (
          kategori.uniqueConstraint === UniqueConstraintType.NO_NOFISIK &&
          !where.noFisik
        )
          shouldCheck = false;

        if (shouldCheck) {
          const duplicate = await this.prisma.arsipSemua.findFirst({
            where,
            select: { id: true },
          });

          if (duplicate) {
            let msg = `Arsip dengan Nomor ${no} sudah ada di kategori ini.`;
            if (kategori.uniqueConstraint === UniqueConstraintType.NO_TANGGAL) {
              msg = `Arsip dengan Nomor ${no} dan Tanggal tersebut sudah ada di kategori ini.`;
            } else if (
              kategori.uniqueConstraint === UniqueConstraintType.NO_NOFISIK
            ) {
              msg = `Arsip dengan Nomor ${no} dan No Fisik tersebut sudah ada di kategori ini.`;
            }
            throw new BadRequestException(msg);
          }
        }
      }
    }
  }

  async create(
    data: CreateArsipDto,
    files: Express.Multer.File[],
    userId: number,
  ) {
    try {
      await this.validateKategoriRules(data.idKategori, data, files);

      const fileRecords: Prisma.ArsipFileCreateWithoutArsipSemuaInput[] = [];

      const year = data.tanggal
        ? new Date(data.tanggal).getFullYear()
        : new Date().getFullYear();
      const uploadSubfolder = `${this.UPLOAD_PATH}/${data.idKategori}/${year}/${data.noFisik}`;

      // Check encryption setting from cached category
      const kategoriResponse = await this.kategoriService.findOne(data.idKategori);
      const isEncrypt = kategoriResponse.data?.isEncrypt || false;

      for (const file of files) {
        let customBuffer: Buffer | undefined;

        // Encrypt only if enabled and file is image
        if (isEncrypt && file.mimetype.match(/\/(jpg|jpeg)$/) && file.buffer) {
          try {
            customBuffer = encryptBuffer(file.buffer);
          } catch (err) {
            throw new BadRequestException(`Gagal mengenkripsi file ${file.originalname}: ${err.message}`);
          }
        }

        const relativePath = await handleUpload({
          file,
          uploadSubfolder,
          customBuffer,
        });

        fileRecords.push({
          originalName: file.originalname,
          path: relativePath,
          uploadBy: { connect: { id: userId } },
        });
      }

      const noEnc = JSON.stringify(encryptValue(data.no));
      const noHash = hashDeterministic(data.no);

      const newRecord = await this.prisma.arsipSemua.create({
        data: {
          ...data,
          noEnc,
          noHash,
          createdById: userId,
          arsipFiles: { create: fileRecords },
        },
        include: { arsipFiles: true },
      });

      const cleaned = autoDecryptAndClean(newRecord);

      return createdResponse('Arsip', cleaned);
    } catch (error) {
      this.logger.error(error);
      handleCreateError(error, 'Arsip');
    }
  }

  async createBySlug(
    slug: string,
    data: Omit<CreateArsipDto, 'idKategori'>,
    files: Express.Multer.File[],
    userId: number,
  ) {
    try {
      const kategoriResponse = await this.kategoriService.findBySlug(slug);
      const kategori = kategoriResponse.data;

      if (!kategori) {
        throw new BadRequestException(
          `Kategori dengan slug ${slug} tidak ditemukan`,
        );
      }

      const fullData: CreateArsipDto = {
        ...data,
        idKategori: kategori.id,
      };

      return this.create(fullData, files, userId);
    } catch (error) {
      this.logger.error(error);
      handleCreateError(error, 'Arsip');
    }
  }

  async findAll(dto: FindAllArsipDto, userId?: number) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'desc',
      kategoriId,
    } = dto;

    const where: any = {};

    if (userId) where.createdById = userId;
    if (kategoriId) where.idKategori = kategoriId;

    if (search) {
      const noHash = hashDeterministic(search);

      where.OR = [
        { no: { contains: search, mode: 'insensitive' } },
        { noFisik: { contains: search, mode: 'insensitive' } },
        { nama: { contains: search, mode: 'insensitive' } },
        { noHash: { equals: noHash } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.arsipSemua.count({ where }),
      this.prisma.arsipSemua.findMany({
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

    return listResponse('Arsip', cleaned, meta);
  }

  async findOne(id: number, userId?: number) {
    try {
      const data = await this.prisma.arsipSemua.findFirstOrThrow({
        where: { id },
        include: { arsipFiles: { orderBy: { id: 'asc' } } },
      });

      const cleaned = autoDecryptAndClean(data);

      return foundResponse('Arsip', cleaned);
    } catch (error) {
      this.logger.error(error);
      handleFindError(error, 'Arsip');
    }
  }

  async update(
    id: number,
    data: UpdateArsipDto,
    files: Express.Multer.File[],
    userId: number,
    userRole: string,
  ) {
    try {
      const existingRecord = await this.prisma.arsipSemua.findFirstOrThrow({
        where: { id },
        include: { arsipFiles: true },
      });

      if (userRole === 'OPERATOR' && existingRecord.createdById !== userId) {
        throw new ForbiddenException(
          'Anda hanya dapat mengedit arsip milik Anda sendiri',
        );
      }

      const kategoriId = data.idKategori ?? existingRecord.idKategori;

      const mergedData: Partial<CreateArsipDto> = {
        ...data,
        nama: data.nama ?? existingRecord.nama ?? undefined,
        tanggal: data.tanggal ?? existingRecord.tanggal ?? undefined,
      };

      await this.validateKategoriRules(
        kategoriId,
        mergedData,
        files,
        existingRecord.arsipFiles.length,
        id,
      );

      // Exclude fileIds from updatePayload as it's not a column in ArsipSemua
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fileIds, ...restData } = data;

      const updatePayload: any = {
        ...restData,
        createdById: userId,
      };

      if (data.no) {
        updatePayload.noEnc = JSON.stringify(encryptValue(data.no));
        updatePayload.noHash = hashDeterministic(data.no);
      }

      // --- Transaksi aman ---
      return await this.prisma.$transaction(async (tx) => {
        // Update data utama terlebih dahulu
        const updatedArsip = await tx.arsipSemua.update({
          where: { id },
          data: updatePayload,
          include: { arsipFiles: true },
        });

        // Determine path structure variables
        const finalTanggal = mergedData.tanggal || existingRecord.tanggal;
        const year = finalTanggal
          ? new Date(finalTanggal).getFullYear()
          : new Date().getFullYear();
        const finalNoFisik = mergedData.noFisik || existingRecord.noFisik;

        const uploadSubfolder = `${this.UPLOAD_PATH}/${kategoriId}/${year}/${finalNoFisik}`;

        // Check encryption setting
        const kategoriResponse = await this.kategoriService.findOne(kategoriId);
        const isEncrypt = kategoriResponse.data?.isEncrypt || false;

        // --- Ambil daftar fileIds dari body ---
        // Note: fileIds sudah ditransform oleh Zod menjadi number[]
        const fileIds = data.fileIds || [];

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

            let customBuffer: Buffer | undefined;
            if (isEncrypt && newFile.mimetype.match(/\/(jpg|jpeg)$/) && newFile.buffer) {
              customBuffer = encryptBuffer(newFile.buffer);
            }

            // Upload file baru dan hapus file lama dari disk menggunakan helper
            const newPath = await handleUploadAndUpdate({
              file: newFile,
              oldFilePath: oldFile.path,
              uploadSubfolder,
              customBuffer,
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
                arsipSemua: { connect: { id } },
              },
            });
          }
        }

        // Ambil data terbaru setelah semua update dan penambahan file
        const refreshed = await tx.arsipSemua.findUnique({
          where: { id },
          include: { arsipFiles: { orderBy: { id: 'asc' } } },
        });

        const cleaned = autoDecryptAndClean(refreshed);

        return updatedResponse('Arsip', cleaned);
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
      this.logger.error(error);
      handleUpdateError(error, 'Arsip');
    }
  }

  async removeFile(fileId: number, userId: number, userRole: string) {
    try {
      const file = await this.prisma.arsipFile.findUniqueOrThrow({
        where: { id: fileId },
        include: {
          arsipSemua: {
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

      if (!file.arsipSemua) {
        throw new BadRequestException('File tidak memiliki relasi arsip');
      }

      if (userRole === 'OPERATOR' && file.arsipSemua.createdById !== userId) {
        throw new ForbiddenException(
          'Anda tidak memiliki izin untuk menghapus file ini',
        );
      }

      const totalFiles = file.arsipSemua.arsipFiles.length;
      if (totalFiles <= 1) {
        throw new BadRequestException(
          'Tidak dapat menghapus semua file, setidaknya harus ada 1 file tersisa.',
        );
      }

      await deleteFileFromDisk(file.path);

      await this.prisma.arsipFile.delete({
        where: { id: fileId },
      });

      return deletedResponse('File');
    } catch (error) {
      this.logger.error(error);
      handleDeleteError(error, 'File arsip');
    }
  }

  async remove(id: number, userId: number, userRole: string) {
    try {
      const existingRecord = await this.prisma.arsipSemua.findFirstOrThrow({
        where: { id },
        include: { arsipFiles: true },
      });

      if (userRole === 'OPERATOR' && existingRecord.createdById !== userId) {
        throw new ForbiddenException(
          'Anda hanya dapat menghapus arsip milik Anda sendiri',
        );
      }

      if (existingRecord.arsipFiles && existingRecord.arsipFiles.length > 0) {
        for (const file of existingRecord.arsipFiles) {
          await deleteFileFromDisk(file.path);
        }
      }

      await this.prisma.arsipSemua.delete({ where: { id } });

      return deletedResponse('Arsip', existingRecord);
    } catch (error) {
      this.logger.error(error);
      handleDeleteError(error, 'Arsip');
    }
  }

  async serveFile(fileId: number, res: any) {
    try {
      const file = await this.prisma.arsipFile.findUniqueOrThrow({
        where: { id: fileId },
        include: {
          arsipSemua: {
            include: {
              kategori: true,
            },
          },
        },
      });

      const uploadRoot = require('path').join(process.cwd(), 'uploads');
      const fullPath = require('path').join(uploadRoot, file.path);
      const fs = require('fs');

      if (!fs.existsSync(fullPath)) {
        throw new BadRequestException('File fisik tidak ditemukan');
      }

      // Cek apakah file adalah JPG (target enkripsi)
      if (file.originalName.match(/\.(jpg|jpeg)$/i)) {
        // Coba decrypt dulu (Smart Decrypt)
        // Ini menangani kasus:
        // 1. Kategori isEncrypt=true (file terenkripsi) -> Decrypt sukses
        // 2. Kategori isEncrypt=false tapi file lama masih terenkripsi -> Decrypt sukses
        // 3. Kategori isEncrypt=true tapi file belum terenkripsi (baru diubah) -> Decrypt gagal -> Serve raw
        // 4. Kategori isEncrypt=false (file biasa) -> Decrypt gagal -> Serve raw

        try {
          const fileBuffer = await fs.promises.readFile(fullPath);
          const decrypted = decryptBuffer(fileBuffer);

          res.set({
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `inline; filename="${file.originalName}"`,
            'Content-Length': decrypted.length,
          });
          res.send(decrypted);
          return;
        } catch (e) {
          // Jika gagal decrypt (misal karena file tidak terenkripsi),
          // abaikan error dan lanjut serve file biasa di bawah
        }
      }

      // Serve normal file (fallback atau non-JPG)
      res.sendFile(file.path, { root: uploadRoot });
    } catch (error) {
      this.logger.error(error);
      handleFindError(error, 'File Arsip');
    }
  }

  async toggleSync(id: number) {
    try {
      const arsip = await this.prisma.arsipSemua.findUniqueOrThrow({
        where: { id },
      });

      const updated = await this.prisma.arsipSemua.update({
        where: { id },
        data: {
          isSync: !arsip.isSync,
          syncAt: !arsip.isSync ? new Date() : null,
        },
      });

      return {
        message: updated.isSync ? 'Arsip berhasil disinkronisasi' : 'Sinkronisasi dibatalkan',
        data: updated,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Gagal mengubah status sinkronisasi');
    }
  }
}
