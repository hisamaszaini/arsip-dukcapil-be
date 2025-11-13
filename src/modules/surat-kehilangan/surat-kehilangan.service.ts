import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDto, FindAllSuratKehilanganDto, UpdateDto } from './dto/surat-kehilangan.dto';
import { deleteFileFromDisk, handleUpload, handleUploadAndUpdate } from '@/common/utils/file';
import { handleCreateError, handleDeleteError, handleFindError, handleUpdateError } from '@/common/utils/handle-prisma-error';
import { autoDecryptAndClean, encryptValue, hashDeterministic } from '@/common/utils/EncDecHas';
import { createdResponse, deletedResponse, foundResponse, listResponse, updatedResponse } from '@/common/utils/success-helper';

@Injectable()
export class SuratKehilanganService {
  private readonly UPLOAD_PATH = 'surat-kehilangan';

  constructor(private prisma: PrismaService) { }

  async create(data: CreateDto, files: Express.Multer.File[], userId: number) {
    if (!files?.length) {
      throw new BadRequestException('Minimal satu file wajib diunggah.');
    }

    const { nik, ...rest } = data;

    const nikEnc = JSON.stringify(encryptValue(nik));
    const nikHash = hashDeterministic(nik);

    const uploadedPaths: string[] = [];

    try {
      const file = files[0];

      const relativePath = await handleUpload({
        file,
        uploadSubfolder: this.UPLOAD_PATH,
      });

      uploadedPaths.push(relativePath);

      // ---------- Simpan ke database ----------
      const newRecord = await this.prisma.suratKehilangan.create({
        data: {
          ...rest,
          nik,
          nikEnc,
          nikHash,
          file: relativePath,
          createdById: userId,
        },
      });

      return createdResponse(
        'Surat Kehilangan',
        autoDecryptAndClean(newRecord),
      );

    } catch (error) {
      // ---------- Rollback file jika gagal ----------
      for (const p of uploadedPaths) {
        await deleteFileFromDisk(p).catch(() => { });
      }

      handleCreateError(error, 'Surat Kehilangan');
    }
  }

  async findAll(dto: FindAllSuratKehilanganDto, userId?: number) {
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
      this.prisma.suratKehilangan.count({ where }),
      this.prisma.suratKehilangan.findMany({
        where,
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
    return listResponse('Surat Kehilangan', cleaned, meta);
  }

  async findOne(id: number, userId?: number) {
    try {
      const data = await this.prisma.suratKehilangan.findFirstOrThrow({
        where: { id }
      });

      if (userId && data.createdById !== userId) throw new ForbiddenException("Anda tidak diizinkan mengambil surat kehilangan ini.");
      const cleaned = autoDecryptAndClean(data);

      return foundResponse('Surat Kehilangan', cleaned);
    } catch (error) {
      handleFindError(error, 'Surat Kehilangan');
    }
  }

  async update(
    id: number,
    data: UpdateDto,
    files: { [key: string]: Express.Multer.File[] },
    userId?: number,
  ) {
    try {
      // ---------- Ambil record ----------
      const record = await this.prisma.suratKehilangan.findFirstOrThrow({
        where: { id },
      });

      // ---------- Cek otorisasi jika userId disediakan ----------
      if (userId && record.createdById !== userId) {
        throw new ForbiddenException('Anda tidak diizinkan memperbarui surat ini.');
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

      // ---------- Tentukan subfolder ----------
      const uploadSubfolder = this.UPLOAD_PATH;

      // ---------- Siapkan data update ----------
      let newFilePath = record.file;

      // Jika ada file baru → upload + hapus file lama
      if (files.file?.[0]) {
        newFilePath = await handleUploadAndUpdate({
          file: files.file[0],
          oldFilePath: record.file,
          uploadSubfolder,
        });
      }

      const updatedData = {
        nik: newNik ?? record.nik,
        nikEnc: nikEnc,
        nikHash: nikHash,
        noFisik: data.noFisik ?? record.noFisik,
        tanggal: data.tanggal,
        file: newFilePath,
      };

      // ---------- 5. Simpan dengan transaction ----------
      return this.prisma.$transaction(async (tx) => {
        const updatedRecord = await tx.suratKehilangan.update({
          where: { id },
          data: updatedData,
        });

        const cleaned = autoDecryptAndClean(updatedRecord);

        return updatedResponse('Surat Kehilangan', cleaned);
      });

    } catch (error) {
      handleUpdateError(error, 'Surat Kehilangan');
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

      return deletedResponse('Surat Kehilangan');
    } catch (error) {
      handleDeleteError(error, 'Surat Kehilangan');
    }
  }
}
