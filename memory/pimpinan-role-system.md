---
name: pimpinan-role-system
description: Sistem role Pimpinan untuk approval surat keluar dan disposisi surat masuk
type: project
---

SuratAPP memiliki tiga role: **Admin**, **Pimpinan**, **Staff**.

## Wewenang Pimpinan
- Melihat semua surat masuk & keluar
- Memberikan **disposisi** pada surat masuk (detail surat)
- **Menyetujui / menolak** surat keluar (detail surat)
- Melihat dashboard dengan statistik approval & disposisi
- Mengakses Audit Log (read-only)
- Tidak boleh: membuat/edit/hapus surat, mengakses Pengguna / Pengaturan / Referensi

## Akun Default
- `pimpinan@surat.app` / `password123`

## Alur Approval Surat Keluar
1. Staff buat surat keluar → status **Menunggu Persetujuan**
2. Pimpinan/Admin buka detail → klik **Setujui** atau **Tolak**
3. Jika ditolak, wajib isi alasan
4. Staff tidak bisa edit/hapus surat yang sudah disetujui

## Alur Disposisi Surat Masuk
1. Staff buat surat masuk
2. Pimpinan/Admin buka detail → klik **Tambah Disposisi**
3. Isi instruksi, ditujukan ke, tanggal, catatan
4. Staff melihat instruksi di detail surat

## File Teknis Penting
- Schema: `prisma/schema.prisma` (enum `UserRole`, kolom approval di `OutgoingLetter`)
- Migrations: `prisma/migrations/20260616100000_add_pimpinan_role/`
- Helpers: `lib/auth-utils.ts`
- Server actions approval: `lib/actions/outgoing-letter.actions.ts` (`approveOutgoingLetter`, `rejectOutgoingLetter`)
- UI approval: `components/outgoing-approval-actions.tsx`
- Pembatasan disposisi: `components/disposition-list.tsx` prop `canAdd`
- Dashboard statistik: `app/(dashboard)/dashboard/page.tsx`

**Why:** Memisahkan wewenang operasional (Staff) dan keputusan atasan (Pimpinan) sesuai alur birokrasi kampus.

**How to apply:** Saat menambah fitur baru, selalu periksa wewenang role melalui `lib/auth-utils.ts` agar Pimpinan tetap hanya read + approve/disposisi.
