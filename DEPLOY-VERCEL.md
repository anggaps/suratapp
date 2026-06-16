# Panduan Deploy SuratAPP ke Vercel

SuratAPP sekarang dikonfigurasi untuk **PostgreSQL** agar kompatibel dengan Vercel. SQLite **tidak didukung** di Vercel karena filesystem serverless tidak persisten.

## Konfigurasi yang Sudah Tersedia

- `prisma/schema.prisma` menggunakan provider `postgresql`.
- `prisma/migrations/20260616070000_init_postgresql/` berisi migration awal PostgreSQL.
- `vercel.json` berisi build command yang otomatis menjalankan migrasi saat deploy.
- `package.json` memiliki `postinstall: prisma generate`.
- `next.config.ts` diatur `output: standalone` dan `images.unoptimized`.

## Provider PostgreSQL yang Direkomendasikan

Pilih salah satu:

- [Neon](https://neon.tech) — gratis tier tersedia
- [Supabase](https://supabase.com) — gratis tier tersedia
- [Vercel Postgres](https://vercel.com/storage/postgres)

## Environment Variables Wajib di Vercel

| Variable | Keterangan | Contoh |
|----------|------------|--------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXTAUTH_SECRET` | Secret key Auth.js | minimal 32 karakter random |
| `NEXTAUTH_URL` | URL domain Vercel | `https://suratapp.vercel.app` |
| `NODE_ENV` | Mode production | `production` |

## Environment Variables Opsional (Cloud Storage Lampiran)

Sangat direkomendasikan untuk Vercel karena filesystem tidak persisten:

```env
S3_ENDPOINT=https://s3.example.com
S3_REGION=auto
S3_BUCKET=nama-bucket
S3_ACCESS_KEY_ID=access-key
S3_SECRET_ACCESS_KEY=secret-key
S3_PUBLIC_URL=https://cdn.example.com
```

Jika tidak dikonfigurasi, lampiran akan disimpan di `public/uploads` dan bisa hilang saat redeploy.

## Langkah Deploy ke Vercel

### 1. Siapkan Database PostgreSQL

1. Buat akun di [Neon](https://neon.tech) atau [Supabase](https://supabase.com).
2. Buat project/database baru.
3. Copy **connection string** PostgreSQL-nya.

### 2. Push Repository ke GitHub

```bash
git init
git add .
git commit -m "feat: configure for vercel + postgresql"
git branch -M main
git remote add origin https://github.com/username/suratapp.git
git push -u origin main
```

### 3. Import ke Vercel

1. Login ke [vercel.com](https://vercel.com).
2. Klik **Add New Project**.
3. Import repository SuratAPP dari GitHub.
4. Pada halaman konfigurasi:
   - **Framework Preset**: Next.js
   - **Build Command**: biarkan default (sudah diatur oleh `vercel.json`)
   - **Root Directory**: `./`
5. Klik **Environment Variables** dan tambahkan:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `NODE_ENV`
6. Klik **Deploy**.

### 4. Jalankan Migrasi ke Database Production

Setelah deploy berhasil, jalankan migrasi dari local machine dengan `DATABASE_URL` diarahkan ke production:

```bash
# Di Windows PowerShell:
$env:DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
npx prisma migrate deploy

# Atau di bash:
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" npx prisma migrate deploy
```

### 5. Seed Data Awal

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" npx prisma db seed
```

### 6. Verifikasi Deploy

1. Buka URL Vercel.
2. Login dengan akun default:
   - Admin: `admin@surat.app` / `password123`
   - Staff: `staff@surat.app` / `password123`
3. Ganti password default setelah login.

## Build Command

`vercel.json` sudah mengatur build command:

```bash
npm install && npx prisma migrate deploy && npm run build
```

Catatan: `npx prisma migrate deploy` di Vercel akan dijalankan setiap build. Pastikan `DATABASE_URL` valid.

## Perintah Berguna

```bash
# Generate ulang Prisma client
npx prisma generate

# Cek status migrasi
npx prisma migrate status

# Reset database development (hati-hati!)
npx prisma migrate reset
```

## Perubahan Schema Prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Peringatan

- Jangan deploy dengan SQLite ke Vercel.
- Pastikan `NEXTAUTH_SECRET` kuat dan unik.
- Backup database PostgreSQL secara rutin.
- Gunakan cloud storage untuk lampiran agar tidak hilang saat redeploy.

## Status Validasi

- [x] TypeScript type check: `npm run typecheck` ✅
- [x] Production build: `npm run build` ✅
- [x] Schema Prisma PostgreSQL ✅
- [x] Migration PostgreSQL ✅
- [x] `vercel.json` konfigurasi ✅
