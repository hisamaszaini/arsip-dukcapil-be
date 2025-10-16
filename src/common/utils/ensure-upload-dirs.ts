import * as fs from 'fs';
import * as path from 'path';

const folders = [
  'akta-kelahiran',
  'akta-kematian',
  'surat-kehilangan',
];

export function ensureUploadDirs() {
  folders.forEach(f =>
    fs.mkdirSync(path.resolve('uploads', f), { recursive: true }),
  );
}