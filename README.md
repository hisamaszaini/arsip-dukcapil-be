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

# 🚀 Instalasi & Menjalankan Proyek

## 1️⃣ Clone Repository

```bash
git clone https://github.com/hisamaszaini/arsip-dukcapil-be/
cd arsip-dukcapil-be
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Copy & Sesuaikan Environment

```bash
cp .env.example .env
```

Edit nilai-nilai penting di file `.env` sesuai kebutuhan (database, JWT secret, file size, enkripsi, dll).

## 4️⃣ Jalankan Seeder (Data Awal)

Script seeder berada pada:

```json
"prisma:seed": "ts-node prisma/seed.ts"
```

Jalankan:

```bash
npm run prisma:seed
```

## 5️⃣ Build Project (opsional untuk production)

```bash
npm run build
```

## 6️⃣ Menjalankan Server

### Development Mode
```bash
npm run start:dev
```

### Development Normal
```bash
npm run start
```

### Debug Mode
```bash
npm run start:debug
```

### Production Mode
```bash
npm run start:prod
```

---

# 📌 Fitur Utama

### 🔒 Enkripsi & Hashing (Keamanan Data)
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

### 📌 Fitur Utama

### 🔐 Manajemen User
- Admin  
- Petugas  
- Masyarakat  
- Login & refresh token JWT  
- Pengaturan akun  

### 📄 CRUD Arsip
- Akta Kelahiran  
- Akta Kematian  
- Surat Kehilangan  
- Surat Permohonan Pindah  
- Surat Perubahan Kependudukan  

### 📦 File Handling
- Upload multi-file  
- Penyimpanan berelasi  
- Otomatis hapus file lama saat update/delete  

### 🔒 Keamanan Data
- Enkripsi opsional (AES + HMAC)
- Hashing data sensitif (SHA-256)
- Melindungi data seperti NIK, nomor dokumen, dan arsip penting

### 📊 Dashboard
- Ringkasan seluruh arsip  
- Total, status, dan grafik  

### ⚙️ Backend Support
- Prisma ORM (PostgreSQL)  
- Global success & error formatter  
- Struktur folder rapi & modular  

---

# 📁 Menu Utama (Aplikasi)

- Dashboard  
- Data User  
- Layanan Arsip  
  - Akta Kelahiran  
  - Akta Kematian  
  - Surat Kehilangan  
  - Surat Permohonan Pindah  
  - Surat Perubahan Kependudukan  
- Pengaturan Akun  
- Logout  

---

