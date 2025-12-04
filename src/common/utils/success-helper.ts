/**
 * Tipe response sukses standar untuk API.
 *
 * @template T - Tipe data yang dikembalikan di field `data`.
 */
export interface SuccessResponse<T = any> {
  /** Menandakan bahwa response berhasil */
  success: true;

  /** Pesan tambahan (opsional) */
  message?: string;

  /** Data yang dikembalikan (opsional) */
  data?: T;

  /** Informasi tambahan seperti pagination (opsional) */
  meta?: Record<string, any>;

  /** Path endpoint yang memicu response (opsional, jika diisi lewat interceptor) */
  path?: string;
}

/**
 * Helper untuk menghasilkan response sukses standar.
 *
 * @template T - Tipe data yang dikembalikan.
 *
 * @param message - Pesan success (opsional)
 * @param data - Data yang dikembalikan (opsional)
 * @param meta - Informasi tambahan, misalnya pagination (opsional)
 *
 * @returns Objek response sukses sesuai struktur `SuccessResponse`
 */
export function successResponse<T>(
  message?: string,
  data?: T,
  meta?: Record<string, any>,
): SuccessResponse<T> {
  return {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  };
}

/**
 * Helper generik untuk response sukses berdasarkan aksi CRUD.
 */
export function createdResponse<T>(
  entity: string,
  data?: T,
  meta?: Record<string, any>,
): SuccessResponse<T> {
  return successResponse(`${entity} berhasil dibuat`, data, meta);
}

export function updatedResponse<T>(
  entity: string,
  data?: T,
  meta?: Record<string, any>,
): SuccessResponse<T> {
  return successResponse(`${entity} berhasil diperbarui`, data, meta);
}

export function deletedResponse(
  entity: string,
  meta?: Record<string, any>,
): SuccessResponse<null> {
  return successResponse(`${entity} berhasil dihapus`, null, meta);
}

/**
 * FindOne: berhasil menemukan satu data
 */
export function foundResponse<T>(entity: string, data: T): SuccessResponse<T> {
  return successResponse(`${entity} berhasil diambil`, data);
}

/**
 * FindAll: untuk daftar + pagination (meta)
 */
export function listResponse<T>(
  entity: string,
  data: T,
  meta?: Record<string, any>,
): SuccessResponse<T> {
  return successResponse(`Daftar ${entity} berhasil diambil`, data, meta);
}
