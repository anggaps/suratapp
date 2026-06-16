# Rencana Implementasi: Fitur Administrasi Surat Kampus

## Ringkasan
Menambahkan dua fitur utama untuk mendukung administrasi surat di kampus:
1. **Pencarian & Filter Surat yang Lebih Lengkap** — filter dan pencarian multi-kolom untuk surat masuk, surat keluar, dan agenda.
2. **Audit Log / Riwayat Aktivitas Surat** — mencatat setiap pembuatan, perubahan, dan penghapusan surat beserta siapa yang melakukannya.

## Keputusan dari Klarifikasi
- Fitur pertama: pencarian & filter lebih lengkap.
- Fitur kedua: audit log / riwayat aktivitas surat.

---

## Fitur 1: Pencarian & Filter Surat yang Lebih Lengkap

### Tujuan
Memudahkan admin/staff menemukan surat berdasarkan berbagai kriteria, bukan hanya pencarian teks sederhana.

### Kolom Filter
Untuk halaman **Surat Masuk**, **Surat Keluar**, dan **Agenda**:

| Filter | Keterangan |
|--------|------------|
| `q` | Pencarian global teks |
| `from` | Tanggal mulai (date surat) |
| `to` | Tanggal akhir (date surat) |
| `classificationId` | Filter berdasarkan klasifikasi surat |
| `statusId` | Filter berdasarkan sifat/status surat |
| `page` | Halaman pagination |

### Token Pencarian Global
Pencarian `q` akan mencari di kolom-kolom berikut:
- Surat masuk: `agendaNumber`, `letterNumber`, `sender`, `subject`
- Surat keluar: `agendaNumber`, `letterNumber`, `recipient`, `subject`
- Agenda: sama seperti di atas

### Perubahan UI
- Form filter horizontal di atas tabel.
- Input pencarian + dropdown klasifikasi + dropdown status + input tanggal dari-sampai + tombol filter.
- Tombol "Reset Filter" untuk membersihkan semua query param.

### File yang diubah
- `app/(dashboard)/surat-masuk/page.tsx`
- `app/(dashboard)/surat-keluar/page.tsx`
- `app/(dashboard)/agenda/page.tsx`
- `components/filter-panel.tsx` (baru)

### Implementasi Server
- Membangun `where` clause Prisma secara dinamis berdasarkan query params.
- Tanggal difilter pada kolom `date`.
- Filter klasifikasi/status menggunakan `classificationId` dan `statusId`.

---

## Fitur 2: Audit Log / Riwayat Aktivitas Surat

### Tujuan
Mencatat setiap aksi penting pada surat masuk dan surat keluar agar bisa ditelusuri siapa yang mengubah apa dan kapan.

### Skema Database (Migration Baru)
Menambahkan model `AuditLog` ke `prisma/schema.prisma`:

```prisma
model AuditLog {
  id             String   @id @default(uuid())
  entityType     String   // "IncomingLetter" | "OutgoingLetter" | "IncomingDisposition" | "Attachment"
  entityId       String   // ID dari entity yang diubah
  action         String   // "CREATE" | "UPDATE" | "DELETE"
  performedBy    String   // user.id
  payload        String?  // JSON string dari data yang berubah atau data baru
  createdAt      DateTime @default(now())

  performer      User     @relation(fields: [performedBy], references: [id])

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

Menambahkan relasi di `User`:
```prisma
auditLogs      AuditLog[]
```

### Aksi yang Dicatat
| Entity | Aksi |
|--------|------|
| IncomingLetter | CREATE, UPDATE, DELETE |
| OutgoingLetter | CREATE, UPDATE, DELETE |
| IncomingDisposition | CREATE, DELETE |
| Attachment | CREATE, DELETE |

### Format Payload
Disimpan sebagai JSON string, berisi ringkasan perubahan:
- `CREATE`: data baru yang dibuat.
- `UPDATE`: perbedaan field sebelum/sesudah (old values, new values).
- `DELETE`: data sebelum dihapus.

### Tempat Menampilkan Audit Log
1. **Halaman Detail Surat** — card baru "Riwayat Aktivitas" menampilkan log untuk surat tersebut.
2. **Dashboard** — card "Aktivitas Terbaru" menggantikan card statis yang ada, menampilkan log global terbaru.
3. **Menu baru "Audit Log"** (opsional, admin only) — halaman khusus melihat semua log dengan filter.

### File yang diubah / baru
- `prisma/schema.prisma` — tambah model AuditLog.
- `prisma/migrations/20260616000000_add_audit_log/` — migration baru.
- `lib/actions/incoming-letter.actions.ts` — log CREATE/UPDATE/DELETE.
- `lib/actions/outgoing-letter.actions.ts` — log CREATE/UPDATE/DELETE.
- `lib/actions/audit.actions.ts` (baru) — helper createAuditLog dan query log.
- `components/audit-log-list.tsx` (baru) — tampilan daftar log.
- `app/(dashboard)/surat-masuk/[id]/page.tsx` — tampilkan audit log surat.
- `app/(dashboard)/surat-keluar/[id]/page.tsx` — tampilkan audit log surat.
- `app/(dashboard)/dashboard/page.tsx` — tampilkan aktivitas terbaru dari audit log.
- `components/sidebar.tsx` — tambah menu Audit Log untuk admin.
- `app/(dashboard)/audit-log/page.tsx` (baru) — halaman audit log global.

---

## Urutan Implementasi
1. **Pencarian & Filter Surat**
   - Buat komponen `FilterPanel` reusable.
   - Update query dan UI di surat masuk, surat keluar, dan agenda.
2. **Audit Log**
   - Tambah model dan migration.
   - Update semua server action surat untuk mencatat log.
   - Buat helper action dan komponen tampilan log.
   - Integrasi ke detail surat, dashboard, dan sidebar menu.
3. **Verifikasi**
   - Jalankan `npx prisma migrate dev`.
   - Jalankan `npm run typecheck` dan `npm run build`.

## Estimasi Dampak File
- 3 file halaman utama diubah.
- 2 file halaman detail diubah.
- 4 file action diubah.
- 5 file baru (komponen + action + halaman + util).
- 1 migration baru.

## Catatan
- Audit log tidak mengubah perilaku fitur yang ada, hanya menambah pencatatan.
- Pencarian dan filter sepenuhnya server-side menggunakan query params.
