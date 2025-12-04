import * as crypto from 'crypto';
import { BadRequestException } from '@nestjs/common';

/**
 * AES_KEY & HMAC_KEY harus 32 bytes (256 bit)
 * Simpan dalam base64
 */
const AES_KEY = process.env.AES_KEY
  ? Buffer.from(process.env.AES_KEY, 'base64')
  : (() => {
    throw new BadRequestException('Missing AES_KEY in environment');
  })();

const HMAC_KEY = process.env.HMAC_KEY
  ? Buffer.from(process.env.HMAC_KEY, 'base64')
  : (() => {
    throw new BadRequestException('Missing HMAC_KEY in environment');
  })();

/* ============================================
   ENCRYPT VALUE (ANY STRING FIELD)
   ============================================ */
export function encryptValue(value: string) {
  if (!value) throw new BadRequestException('Value to encrypt cannot be empty');

  const iv = crypto.randomBytes(12); // AES-GCM nonce
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);

  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ciphertext.toString('base64'),
  };
}

/* ============================================
   DECRYPT VALUE
   ============================================ */
export function decryptValue(payload: { iv: string; tag: string; ct: string }) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      AES_KEY,
      Buffer.from(payload.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ct, 'base64')),
      decipher.final(),
    ]);

    return plaintext.toString('utf8');
  } catch (err) {
    throw new BadRequestException('Gagal dekripsi data terenkripsi');
  }
}

/* ============================================
   SEARCHABLE HASH (DETERMINISTIC HMAC)
   ============================================ */
export function hashDeterministic(value: string) {
  if (!value) throw new BadRequestException('Value to hash cannot be empty');

  return crypto.createHmac('sha256', HMAC_KEY).update(value).digest('hex');
}

/* ============================================
   AUTO DECRYPT & CLEAN RESPONSE (FOR API)
   ============================================ */
export function autoDecryptAndClean<T = any>(data: T): T {
  if (!data) return data;

  // Array → proses tiap item
  if (Array.isArray(data)) {
    return data.map((item) => autoDecryptAndClean(item)) as T;
  }

  // Jika Date → return apa adanya
  if (data instanceof Date) {
    return data;
  }

  // Jika bukan object → return apa adanya
  if (typeof data !== 'object') return data;

  const result: any = { ...data };

  for (const key of Object.keys(result)) {
    const value = result[key];

    // Recursive pada nested object (relation)
    if (typeof value === 'object' && value !== null) {
      result[key] = autoDecryptAndClean(value);
    }

    // Jika field berakhiran 'Enc'
    if (key.endsWith('Enc') && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        const decrypted = decryptValue(parsed);

        const baseField = key.replace(/Enc$/, ''); // "noAktaEnc" -> "noAkta"
        result[baseField] = decrypted;
      } catch (err) {
        console.error(`Gagal decrypt field: ${key}`, err);
      }

      delete result[key]; // Hapus encrypted field
    }

    // Hapus hash field
    if (key.endsWith('Hash')) {
      delete result[key];
    }
  }

  return result as T;
}

/* ============================================
   FILE ENCRYPTION (BUFFER)
   Format: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
   ============================================ */
export function encryptBuffer(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);

  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine: IV + Tag + Ciphertext
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
  try {
    // Extract parts
    const iv = encryptedBuffer.subarray(0, 12);
    const tag = encryptedBuffer.subarray(12, 28);
    const ciphertext = encryptedBuffer.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err) {
    throw new BadRequestException('Gagal mendekripsi file');
  }
}
