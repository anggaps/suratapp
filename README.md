# SuratAPP

Sistem Manajemen Surat Menyurat berbasis Next.js, Prisma, dan PostgreSQL/SQLite.

## Fitur

- 🔑 Autentikasi & hak akses berbasis peran (admin, staff)
- 📊 Dashboard dengan statistik surat harian, transaksi, dan grafik
- 📥 Manajemen surat masuk (CRUD, pencarian, lampiran, disposisi)
- 📤 Manajemen surat keluar (CRUD, pencarian, lampiran)
- 📅 Agenda surat berdasarkan tanggal dengan cetak
- 🖼️ Galeri lampiran surat
- 📂 Referensi data: klasifikasi & status sifat surat
- 👥 Manajemen pengguna (admin): tambah, edit, hapus, reset password, nonaktifkan
- 🛠️ Pengaturan profil dengan ganti foto
- ⚙️ Pengaturan sistem: identitas aplikasi, kata sandi bawaan, data per halaman

## Teknologi

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM
- Auth.js (NextAuth v5)
- SQLite (development) / PostgreSQL (production)
- Recharts
- date-fns

## Setup

1. Install dependensi:

```bash
npm install
```

2. Salin `.env.example` ke `.env` (atau ubah `.env` yang sudah ada) dan sesuaikan `DATABASE_URL`.

3. Jalankan migrasi dan seed:

```bash
npx prisma migrate dev
npx prisma db seed
```

4. Jalankan server development:

```bash
npm run dev
```

5. Buka http://localhost:3000 dan login dengan:

- Admin: `admin@surat.app` / `password123`
- Staff: `staff@surat.app` / `password123`

## Konfigurasi Cloud Storage (Opsional)

Untuk menyimpan lampiran ke cloud storage (S3-compatible), tambahkan variabel berikut di `.env`:

```env
S3_ENDPOINT=https://s3.example.com
S3_REGION=auto
S3_BUCKET=nama-bucket
S3_ACCESS_KEY_ID=access-key
S3_SECRET_ACCESS_KEY=secret-key
S3_PUBLIC_URL=https://cdn.example.com
```

Jika tidak dikonfigurasi, lampiran akan disimpan di folder `public/uploads`.

## PostgreSQL

Untuk menggunakan PostgreSQL, ubah `provider` di `prisma/schema.prisma` menjadi `postgresql` dan sesuaikan `DATABASE_URL`.

## Script

- `npm run dev` — jalankan server development
- `npm run build` — build untuk production
- `npm run start` — jalankan production server
- `npm run typecheck` — cek TypeScript
- `npm run lint` — jalankan ESLint
