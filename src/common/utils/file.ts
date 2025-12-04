import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Constants
const UPLOAD_PATH = path.resolve(process.cwd(), 'uploads');

// Generate unique filename
export function generateFileName(original: string): string {
  return `${uuidv4()}${path.extname(original)}`;
}

// Write file to disk
export async function writeFileToDisk(
  file: Express.Multer.File,
  name: string,
  subfolder = '',
): Promise<void> {
  try {
    const dirPath = path.join(UPLOAD_PATH, subfolder);
    await fs.promises.mkdir(dirPath, { recursive: true });

    const fullPath = path.join(dirPath, name);
    await fs.promises.writeFile(fullPath, file.buffer);
  } catch (err) {
    throw new InternalServerErrorException('Gagal menyimpan file');
  }
}

// Delete file from disk
export async function deleteFileFromDisk(filePath: string): Promise<void> {
  if (!filePath) return;
  const fullPath = path.join(UPLOAD_PATH, filePath);
  if (fs.existsSync(fullPath)) {
    await fs.promises.unlink(fullPath);
  }
}

// Upload new file (with optional subfolder)
export async function handleUpload(params: {
  file: Express.Multer.File;
  uploadSubfolder?: string;
  customBuffer?: Buffer;
}): Promise<string> {
  const { file, uploadSubfolder = '', customBuffer } = params;

  if (!file || !file.originalname) {
    throw new BadRequestException('File tidak valid atau tidak ditemukan');
  }

  const savedFileName = generateFileName(file.originalname);
  const relativePath = path.posix.join(uploadSubfolder, savedFileName);

  if (customBuffer) {
    // Write custom buffer (e.g. encrypted data) directly to disk
    // We mock a file object with the custom buffer
    const mockFile = { ...file, buffer: customBuffer, path: undefined };
    await writeFileToDisk(mockFile as any, savedFileName, uploadSubfolder);
  } else {
    await writeFileToDisk(file, savedFileName, uploadSubfolder);
  }

  return relativePath;
}

// Upload and delete old file if needed
export async function handleUploadAndUpdate(params: {
  file: Express.Multer.File;
  oldFilePath?: string;
  uploadSubfolder?: string;
  customBuffer?: Buffer;
}): Promise<string> {
  const { file, oldFilePath, uploadSubfolder = '', customBuffer } = params;

  const relativePath = await handleUpload({
    file,
    uploadSubfolder,
    customBuffer,
  });

  if (oldFilePath && !oldFilePath.includes('..')) {
    await deleteFileFromDisk(oldFilePath);
  }

  return relativePath;
}
