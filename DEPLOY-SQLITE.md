# Panduan Deploy SuratAPP dengan SQLite (Railway / Render)

SuratAPP menggunakan SQLite. Vercel **tidak cocok** untuk SQLite karena filesystem-nya tidak persisten. Gunakan platform yang menyediakan filesystem persisten seperti **Railway** atau **Render**.

## Catatan Penting

- SQLite file-based memerlukan disk persisten.
- Railway dan Render menyediakan disk persisten untuk container/app service.
- Backup database secara rutin sangat direkomendasikan.

---

## Opsi 1: Deploy ke Railway

Railway menyediakan deployment mudah dari GitHub dan persistent volume.

### Langkah

1. Push repository SuratAPP ke GitHub (jika belum).
2. Login ke [railway.app](https://railway.app).
3. Klik **New Project** → **Deploy from GitHub repo**.
4. Pilih repository SuratAPP.
5. Railway akan otomatis mendeteksi Next.js.
6. Tambahkan environment variables:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="random-secret-minimal-32-karakter"
   NEXTAUTH_URL="https://domain-railway-anda.up.railway.app"
   NODE_ENV="production"
   ```
7. Tambahkan **persistent volume** untuk folder project agar `dev.db` tidak hilang:
   - Buka service → **Settings** → **Volumes**.
   - Mount path: `/app` atau sesuai working directory.
8. Jalankan migrasi dan seed (bisa lewat Railway CLI atau shell service):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
9. Deploy ulang jika diperlukan.

---

## Opsi 2: Deploy ke Render

Render Web Service juga menyediakan persistent disk.

### Langkah

1. Push repository SuratAPP ke GitHub.
2. Login ke [render.com](https://render.com).
3. Klik **New Web Service** → connect repository GitHub.
4. Konfigurasi:
   - **Name**: SuratAPP
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     npm install && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
5. Tambahkan environment variables:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="random-secret-minimal-32-karakter"
   NEXTAUTH_URL="https://suratapp.onrender.com"
   NODE_ENV="production"
   ```
6. Aktifkan **Disk** untuk service:
   - Buka service → **Disks**.
   - Mount path: `/opt/render/project/src` atau root project.
   - Size: minimal 1 GB.
7. Jalankan seed (via Render Shell):
   ```bash
   npx prisma db seed
   ```
8. Deploy.

---

## Environment Variables Wajib

| Variable | Keterangan |
|----------|------------|
| `DATABASE_URL` | Untuk SQLite: `file:./dev.db` |
| `NEXTAUTH_SECRET` | Secret key Auth.js, minimal 32 karakter random |
| `NEXTAUTH_URL` | URL domain setelah deploy |
| `NODE_ENV` | `production` |

## Environment Variables Opsional (Cloud Storage Lampiran)

Jika ingin lampiran tersimpan di cloud storage:

```env
S3_ENDPOINT=https://s3.example.com
S3_REGION=auto
S3_BUCKET=nama-bucket
S3_ACCESS_KEY_ID=access-key
S3_SECRET_ACCESS_KEY=secret-key
S3_PUBLIC_URL=https://cdn.example.com
```

Jika tidak dikonfigurasi, lampiran akan tersimpan di `public/uploads` di filesystem persistent disk.

---

## Build Commands

### Railway / Render

```bash
npm install
npm run build
npm start
```

Untuk migrasi otomatis saat deploy, gunakan build command:

```bash
npm install && npx prisma migrate deploy && npm run build
```

## Perintah Setelah Deploy

Setelah deploy berhasil:

1. Pastikan `NEXTAUTH_URL` sudah sesuai domain aktual.
2. Jalankan seed untuk data awal (admin, staff, klasifikasi, status):
   ```bash
   npx prisma db seed
   ```
3. Login dengan akun default:
   - Admin: `admin@surat.app` / `password123`
   - Staff: `staff@surat.app` / `password123`
4. Ganti password default setelah login.

---

## Keamanan

- Ganti `NEXTAUTH_SECRET` dari default.
- Ganti password default admin dan staff.
- Backup file `dev.db` secara rutin.
- Pertimbangkan migrasi ke PostgreSQL jika data sudah besar atau butuh concurrent access tinggi.
