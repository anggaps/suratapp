# Rencana Implementasi: Role Khusus Pimpinan

## Ringkasan
Menambahkan peran **Pimpinan** ke SuratAPP sehingga ada hierarki pengguna: **Admin**, **Pimpinan**, **Staff**. Peran ini didesain untuk kebutuhan surat kampus/institusi di mana pimpinan memberikan arahan (disposisi) atas surat masuk dan persetujuan atas surat keluar sebelum dikirimkan resmi.

## Tiga Peran yang Ada

| Peran | Tugas Utama | Akses Pengelolaan |
|-------|-------------|-------------------|
| **ADMIN** | Mengelola pengguna, pengaturan sistem, referensi (klasifikasi/status), melihat semua data & audit log | Full access |
| **PIMPINAN** | Melihat semua surat, memberikan **disposisi** pada surat masuk, **menyetujui/menolak** surat keluar, melihat dashboard & audit log | Read + approve/disposisi |
| **STAFF** | Mencatat surat masuk, membuat surat keluar (draft), mengelola lampiran, melihat surat yang sudah disetujui | Operasional |

## Alur Bisnis yang Dibangun

### 1. Surat Masuk → Disposisi oleh Pimpinan
1. Staff mendaftarkan surat masuk beserta lampiran dan klasifikasi.
2. Pimpinan melihat daftar surat masuk.
3. Di halaman detail surat masuk, Pimpinan menekan **"Tambah Disposisi"** dan mengisi:
   - Instruksi
   - Ditujukan Kepada (bagian/personel)
   - Tanggal disposisi
   - Catatan
4. Sistem mencatat siapa pimpinan yang memberikan disposisi.
5. Staff dapat melihat instruksi disposisi di detail surat masuk.

### 2. Surat Keluar → Persetujuan oleh Pimpinan
1. Staff membuat surat keluar. Status default: **Draft / Menunggu Persetujuan**.
2. Surat keluar muncul di dashboard Pimpinan sebagai "Menunggu Persetujuan".
3. Pimpinan membuka detail surat keluar dan memilih:
   - **Setujui** → surat resmi dikeluarkan, tercatat waktu & siapa pemberi persetujuan.
   - **Tolak** → surat ditolak, wajib mengisi alasan penolakan.
4. Staff melihat status persetujuan di daftar dan detail surat keluar.
5. Surat keluar yang belum disetujui tidak boleh diedit/hapus kecuali oleh Admin (opsional, default: Staff boleh edit draft-nya sendiri).

## Hak Akses Detail

### ADMIN
- Semua yang dimiliki Staff + Pimpinan.
- Mengelola pengguna (termasuk menetapkan role Pimpinan).
- Mengelola pengaturan sistem, klasifikasi, status surat.
- Melihat audit log lengkap.

### PIMPINAN
- Dashboard: statistik khusus "Surat Keluar Menunggu Persetujuan" dan "Disposisi Hari Ini".
- Surat Masuk: hanya **lihat** dan **tambah disposisi** (tidak boleh edit/hapus surat).
- Surat Keluar: hanya **lihat**, **setujui**, **tolak** (tidak boleh edit/hapus).
- Agenda: lihat saja.
- Audit Log: lihat saja.
- Pengguna & Pengaturan: **tidak** bisa diakses.

### STAFF
- Dashboard: statistik operasional.
- Surat Masuk: CRUD lengkap + lampiran + disposisi (opsional, default tetap boleh karena disposisi lama sudah terbuka).
- Surat Keluar: CRUD, tapi status persetujuan ditampilkan; hanya bisa edit saat masih belum disetujui (atau ditolak).
- Agenda: lihat saja (sesuai existing).
- Pengguna & Pengaturan: tidak bisa diakses.

## Perubahan Database (Prisma)

1. **Tambah nilai enum role:**
   ```prisma
   enum UserRole {
     ADMIN
     PIMPINAN
     STAFF
   }
   ```

2. **Tambah kolom persetujuan pada `OutgoingLetter`:**
   ```prisma
   model OutgoingLetter {
     // ... kolom existing ...
     approvedById String?
     approvedAt   DateTime?
     rejectionReason String?
     createdBy    String
     createdAt    DateTime @default(now())
     updatedAt    DateTime @updatedAt

     approvedBy   User?   @relation("ApprovedOutgoingLetters", fields: [approvedById], references: [id])
     // relation existing creator di-rename agar tidak bentrok
     creator      User    @relation("CreatedOutgoingLetters", fields: [createdBy], references: [id])
   }
   ```
   *Catatan: relasi `User.outgoingLetters` perlu di-rename menjadi dua relasi (`createdOutgoingLetters`, `approvedOutgoingLetters`) agar tidak ambigu.*

3. **Perluas entity type AuditLog** (opsional di konstanta aplikasi, bukan di enum DB) dengan nilai baru: `APPROVE` dan `REJECT` untuk `OutgoingLetter`.

## Perubahan Backend

### Auth & Session
- `auth.ts`: sudah mengirim `role` ke JWT/session, tidak perlu banyak ubah.
- `types/next-auth.d.ts`: role tetap `string`, cukup validasi nilai saat dipakai.

### Helpers Autorisasi Baru
Buat `lib/auth-utils.ts` untuk menstandarisasi cek role:
```ts
export function requireAuth(session: Session | null)
export function requireRole(session: Session | null, ...roles: UserRole[])
export function isAnyRole(role: string, ...roles: UserRole[])
```

### Server Actions
- `lib/actions/user.actions.ts`: update schema role agar menerima `PIMPINAN`; reset password tetap Admin.
- `lib/actions/incoming-letter.actions.ts`:
  - `create/update/delete`: batasi edit/hapus hanya untuk Admin/Staff; Pimpinan **hanya boleh lihat**.
  - `createDisposition`: izinkan Admin dan Pimpinan.
- `lib/actions/outgoing-letter.actions.ts`:
  - `create/update/delete`: Staff/Admin.
  - Tambah action baru: `approveOutgoingLetter(id)` dan `rejectOutgoingLetter(id, reason)` untuk Pimpinan/Admin.
- `lib/actions/audit.actions.ts`: semua role yang autentikasi boleh `getAuditLogsForEntity`; `getAllAuditLogs` untuk Admin & Pimpinan (read-only).

### Seed
- `prisma/seed.ts`: tambah user contoh Pimpinan:
  - `pimpinan@surat.app` / `password123` dengan role `PIMPINAN`.

## Perubahan Frontend

### Sidebar (`components/sidebar.tsx`)
Ganti logika `isAdmin` tunggal menjadi helper per menu:
- Menu utama (Dashboard, Surat Masuk, Surat Keluar, Agenda, Galeri): semua role.
- Referensi: Admin + Staff (atau Admin saja? default: Admin saja).
- Pengguna, Pengaturan Sistem: Admin saja.
- Audit Log: Admin + Pimpinan.

### Manajemen Pengguna (`components/user-manager.tsx`)
Dropdown role ditambah opsi **Pimpinan**.
Badge role diberi warna berbeda (Pimpinan ungu/primary tersendiri).

### Dashboard (`app/(dashboard)/dashboard/page.tsx`)
Tambah statistik untuk Pimpinan:
- Surat Keluar Menunggu Persetujuan
- Surat Keluar Disetujui Hari Ini
- Disposisi Hari Ini

Tampilkan card statistik sesuai role (Admin/Staff tetap seperti sekarang, Pimpinan melihat card approval).

### Daftar Surat Keluar (`app/(dashboard)/surat-keluar/page.tsx`)
- Tambah badge status persetujuan: Draft / Menunggu / Disetujui / Ditolak.
- Staff hanya melihat tombol Edit/Delete jika surat belum disetujui.
- Pimpinan melihat tombol **"Setujui / Tolak"** di baris tabel atau di detail.

### Detail Surat Keluar (`app/(dashboard)/surat-keluar/[id]/page.tsx`)
- Tampilkan blok info persetujuan (status, disetujui oleh, tanggal, alasan penolakan).
- Jika status Menunggu dan user adalah Pimpinan/Admin: tampilkan tombol **Setujui** dan **Tolak** (tolak membuka dialog alasan).
- Tombol Edit/Delete tetap untuk Admin/Staff sesuai aturan.

### Detail Surat Masuk (`app/(dashboard)/surat-masuk/[id]/page.tsx`)
- Tombol "Tambah Disposisi" hanya untuk Pimpinan dan Admin (Staff existing boleh dibiarkan sesuai kebutuhan, default: hanya Pimpinan & Admin).
- Tampilkan info pembuat disposisi.

### Daftar Surat Masuk (`app/(dashboard)/surat-masuk/page.tsx`)
- Tambah indikator visual jika surat sudah memiliki disposisi (badge kecil).

### Audit Log (`components/audit-log-list.tsx`)
- Tampilkan aksi `APPROVE` dan `REJECT` dengan warna badge sesuai.

### Loading / Skeleton
- Tidak perlu skeleton khusus; gunakan komponen skeleton yang sudah ada.

## Langkah Implementasi

1. **Database & Schema**
   - Edit `prisma/schema.prisma`: tambah `PIMPINAN` enum dan kolom approval di `OutgoingLetter`.
   - Perbaiki relasi `User` ↔ `OutgoingLetter` agar tidak bentrok.
   - Generate Prisma Client: `npx prisma generate`.
   - Buat & jalankan migrasi: `npx prisma migrate dev --name add_pimpinan_role`.

2. **Seed & Data Awal**
   - Update `prisma/seed.ts`: tambah user Pimpinan contoh.
   - Jalankan seed jika diperlukan (hati-hati di production).

3. **Helpers Autorisasi**
   - Buat `lib/auth-utils.ts`.
   - Update semua server actions agar memanggil helper ini.

4. **Backend Approval**
   - Update `lib/actions/outgoing-letter.actions.ts`:
     - tambah schema approval,
     - tambah `approveOutgoingLetter`,
     - tambah `rejectOutgoingLetter`,
     - log audit untuk APPROVE/REJECT.
   - Update `lib/actions/incoming-letter.actions.ts`:
     - batasi CRUD surat untuk Admin/Staff,
     - batasi createDisposition untuk Admin/Pimpinan.
   - Update `lib/actions/user.actions.ts`: role schema.
   - Update `lib/actions/audit.actions.ts`: entity type & access.

5. **Frontend**
   - Update `components/sidebar.tsx`: visibility menu per role.
   - Update `components/user-manager.tsx`: opsi role Pimpinan & badge.
   - Update dashboard: statistik khusus Pimpinan.
   - Update list/detail surat keluar: badge approval & tombol approve/reject.
   - Update list/detail surat masuk: pembatasan disposisi & badge.
   - Update `components/audit-log-list.tsx`: badge APPROVE/REJECT.

6. **Validasi & Testing**
   - Login sebagai masing-masing role dan verifikasi:
     - Staff bisa CRUD surat masuk/keluar, tidak bisa approve.
     - Pimpinan bisa approve/reject surat keluar, tambah disposisi, tidak bisa ke Pengguna/Pengaturan.
     - Admin tetap full access.
   - Cek audit log mencatat aksi approval/rejection.

## Keputusan yang Perlu Disetujui

Sebelum implementasi, konfirmasi hal berikut:

1. **Apakah Pimpinan boleh juga membuat/edit surat?**
   - *Rekomendasi*: Pimpinan hanya **lihat + approve/disposisi** agar hierarki jelas. Jika perlu, Pimpinan boleh membuat surat tetapi surat buatannya tetap memerlukan persetujuan pimpinan lain (multi-pimpinan) atau dianggap otomatis disetujui.
   - *Pilihan default pada rencana ini*: Pimpinan **hanya lihat + approve/disposisi**, tidak membuat/edit/hapus surat.

2. **Apakah Staff masih boleh menambah disposisi?**
   - *Rekomendasi*: Disposisi adalah wewenang Pimpinan. Staff hanya mencatat surat.
   - *Pilihan default pada rencana ini*: Hanya **Admin & Pimpinan** yang boleh menambah disposisi.

3. **Apakah notifikasi WhatsApp dikirim saat disetujui/ditolak?**
   - *Rekomendasi*: Fase pertama fokus pada status approval. Notifikasi WA ke pembuat surat bisa ditambahkan fase berikutnya untuk menghindari kompleksitas.
   - *Pilihan default pada rencana ini*: **Tidak** otomatis mengirim WA; status approval hanya muncul di aplikasi.

4. **Apakah perlu multi-pimpinan?**
   - *Rekomendasi*: Satu level pimpinan cukup untuk kampus kecil/menengah.
   - *Pilihan default pada rencana ini*: **Satu level** Pimpinan. Admin dapat membuat beberapa akun Pimpinan, tapi satu persetujuan sudah final.

Jika tidak ada keberatan, implementasi akan mengikuti pilihan default di atas.
