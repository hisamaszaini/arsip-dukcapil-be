# 📁 Arsip Dukcapil – Backend API (NestJS)

<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  Backend service untuk pengelolaan arsip kependudukan (DUKCAPIL), dibangun menggunakan
  <a href="https://nestjs.com/" target="_blank">NestJS</a> dengan dukungan enkripsi, upload multi-file, dashboard, dan manajemen user.
</p>

---

# 🚀 Panduan Instalasi & Setup

## 📋 Prasyarat

Pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [PostgreSQL](https://www.postgresql.org/) (Database)
- [Git](https://git-scm.com/)

## 1️⃣ Clone Repository

```bash
git clone https://github.com/hisamaszaini/arsip-dukcapil-be/
cd arsip-dukcapil-be
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Konfigurasi Environment (.env)

Salin file contoh `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Sesuaikan konfigurasi di dalam file `.env`:

```ini
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# JWT Configuration (Ganti dengan string acak yang aman)
JWT_ACCESS_SECRET="rahasia_access_token"
JWT_REFRESH_SECRET="rahasia_refresh_token"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Server Port
PORT=3334

# File Upload Limit (in MB)
MAX_FILE_SIZE_MB=5

# Encryption Settings (Optional)
MODE_ENCRYPT=True
# Generate keys using: openssl rand -hex 32
AES_KEY="32_byte_hex_string"
HMAC_KEY="32_byte_hex_string"
```

> **Catatan:** Jika `MODE_ENCRYPT=True`, pastikan `AES_KEY` dan `HMAC_KEY` diisi dengan string hex 32-byte yang valid.

## 4️⃣ Setup Database & Seeder

Jalankan migrasi database untuk membuat tabel:

```bash
npx prisma migrate dev --name init
```

### 🌱 Database Seeder (Data Awal)

Untuk mengisi database dengan data awal (seperti akun Admin), jalankan perintah berikut:

```bash
npm run prisma:seed
```

**Akun Admin Default:**
- **Email:** `admin@example.com`
- **Password:** `kopikita123`
- **Role:** `ADMIN`

> ⚠️ **PENTING:** Segera ganti password admin setelah login pertama kali!

## 5️⃣ Setup Permission Folder (Linux Server) 🐧

Jika Anda men-deploy aplikasi ini di server Linux (Ubuntu/Debian/CentOS), Anda **wajib** mengatur permission untuk folder `uploads` agar aplikasi dapat menyimpan file arsip.

Jalankan perintah berikut di terminal server:

```bash
# Pastikan folder uploads ada
mkdir -p uploads

# Berikan hak akses write ke folder uploads
# Opsi 1: Ubah owner ke user yang menjalankan aplikasi (Direkomendasikan)
# Ganti 'ubuntu' dengan user server Anda
sudo chown -R ubuntu:ubuntu uploads
chmod -R 755 uploads

# Opsi 2: Berikan akses write ke semua user (Hanya untuk development/testing)
# chmod -R 777 uploads
```

Jika permission tidak diatur, Anda mungkin akan menemui error `EACCES: permission denied` saat mencoba upload file.

## 6️⃣ Menjalankan Aplikasi

### Development Mode
```bash
npm run start:dev
```

### Production Mode
1. Build aplikasi:
   ```bash
   npm run build
   ```
2. Jalankan:
   ```bash
   npm run start:prod
   ```

---

# 📌 Fitur Utama

### �️ Manajemen Kategori Dinamis (Core Feature)
Fitur unggulan yang memungkinkan admin membuat jenis arsip baru tanpa coding:
- **Konfigurasi Field:** Atur label nomor (misal: "NIK", "No. Akta"), dan validasi wajib isi.
- **Validasi Canggih:**
  - Tipe input (Numerik, Alfanumerik, Custom)
  - Panjang karakter (Min/Max)
  - Regex custom & Input Masking
- **Unique Constraints:** Cegah duplikasi data berdasarkan kombinasi (No, No+Tanggal, No+NoFisik).
- **Security Toggle:** Aktifkan/nonaktifkan enkripsi per kategori.

### 📄 Manajemen Arsip Universal
Sistem CRUD arsip yang fleksibel mengikuti konfigurasi kategori:
- **Input Data:** Nomor, Nama, Tanggal, dan Nomor Fisik (Rak/Lemari).
- **File Upload:** Upload banyak file (multi-file) untuk satu data arsip.
- **Pencarian & Filter:** Filter berdasarkan kategori, tanggal, dan status.
- **Keamanan:** Data sensitif (Nomor) di-hash dan di-enkripsi jika kategori mengaktifkan fitur keamanan.

### 🔐 Manajemen User & Role
Hanya terdapat dua role untuk kesederhanaan dan keamanan:
1. **Admin:** Akses penuh ke pengaturan sistem, manajemen user, dan manajemen kategori.
2. **Operator:** Fokus pada input data arsip, pencarian, dan upload file.

### 📦 File Handling
- Upload multi-file
- Penyimpanan file lokal (`/uploads`)
- Otomatis hapus file fisik saat data dihapus

### 📊 Dashboard & Monitoring
- Statistik total arsip per kategori.
- Grafik pertumbuhan data.
- Status sinkronisasi data.

### �🔒 Enkripsi & Hashing (Keamanan Data)
Proyek ini mendukung fitur keamanan tingkat lanjut untuk melindungi data sensitif warga:

#### **1. Enkripsi (AES-256 + HMAC)**
- Opsional, dapat diaktifkan melalui `.env` → `MODE_ENCRYPT=True`
- Menggunakan AES-256-CBC untuk enkripsi data sensitif
- Menggunakan HMAC-SHA256 untuk validasi integritas data
- Digunakan pada field seperti: NIK, nomor arsip, nama file, dll

#### **2. Hashing (SHA-256)**
- Digunakan untuk menghasilkan nilai hash dari data penting yang tidak boleh dibaca kembali
- Berfungsi untuk pencocokan tanpa mengungkap data asli
- Cocok untuk validasi unik seperti: nomor akta, nomor surat, dll

### ⚙️ Backend Support
- **Prisma ORM:** Type-safe database queries.
- **Validation:** Zod schema validation untuk integritas data.
- **Security:** Bcrypt hashing, AES-256 Encryption, HMAC signing.

---

# 📁 Struktur Menu Aplikasi

- **Dashboard** (Statistik Ringkas)
- **Manajemen Arsip** (Dynamic Menu sesuai Kategori yang dibuat)
  - *Contoh: Akta Kelahiran, Kartu Keluarga, dll.*
- **Master Data**
  - **Kategori Arsip** (Buat/Edit jenis arsip & validasi)
- **Pengaturan**
  - **Manajemen User** (Admin & Operator)
- **Logout**

---

# 📁 Struktur Folder

```
backend/
├── prisma/              # Schema database & seeder
├── src/
│   ├── auth/            # Modul autentikasi
│   ├── common/          # Filter, Interceptor, Decorator global
│   ├── modules/         # Modul fitur (Arsip, User, Dashboard)
│   ├── app.module.ts    # Root module
│   └── main.ts          # Entry point
├── uploads/             # Folder penyimpanan file (Gitignored)
├── .env                 # Konfigurasi environment
└── package.json
```
