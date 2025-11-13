import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

const UPLOAD_PATH = path.resolve(process.cwd(), 'uploads');

/**
 * Simpan file ke disk
 * @param file Express.Multer.File
 * @param subfolder folder tujuan (opsional)
 * @returns path file yang disimpan
 */
export async function handleUploadToDisk(params: {
  file: Express.Multer.File;
  subfolder?: string;
}): Promise<string> {
  const { file, subfolder = '' } = params;

  if (!file || !file.originalname) {
    throw new BadRequestException('File tidak valid atau tidak ditemukan');
  }

  const targetDir = path.join(UPLOAD_PATH, subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const uniqueName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(targetDir, uniqueName);
  fs.writeFileSync(filePath, file.buffer);

  return filePath;
}

/**
 * Hapus file lama dari disk (jika ada)
 */
export async function deleteFileIfExists(filePath?: string): Promise<void> {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Gagal menghapus file:', err);
  }
}
