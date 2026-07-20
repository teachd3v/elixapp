# Roadmap Pengembangan ELIX App

Berikut adalah daftar prioritas fitur yang perlu dikerjakan berdasarkan roadmap sebelumnya. Silakan centang (`[x]`) fitur yang sudah diselesaikan.

## 🔴 Fitur Inti Produk (Belum ada backend-nya)
Ini "cara program beroperasi tiap minggu" — tanpa ini, app cuma bisa nilai SA/MA sekali doang.

- [x] **Sesi Pembinaan** (Model `Session` sudah ada, 0 API/UI real)
  - [x] Mentor bikin/edit/hapus jadwal sesi wilayahnya
  - [x] Superadmin bikin sesi nasional
  - [x] Awardee lihat sesi mendatang
- [x] **Absensi** (Model `Attendance` sudah ada, 0 API/UI real)
  - [x] Awardee submit kehadiran (selfie + foto suasana yang ada di kode mock lama)
  - [x] Mentor verifikasi/tolak (MENUNGGU_KONFIRMASI → HADIR/ALFA)
  - [x] Superadmin kelola presensi lintas wilayah
- [x] **Izin** (Model `Excuse` sudah ada, 0 API/UI real)
  - [x] Awardee ajukan izin dengan alasan + bukti
  - [x] Mentor approve/reject (PENDING → APPROVED/REJECTED)
- [x] **Pengumuman** (Model `Announcement` sudah ada, 0 API/UI real)
  - [x] Mentor kirim ke awardee di wilayahnya
  - [x] Superadmin kirim nasional/per wilayah
  - [x] Notifikasi & bel di header awardee/mentor

## 🟡 Fitur Menengah (Lebih ringan tapi belum)
- [x] **Portfolio Awardee**
  - Belum ada model Prisma sama sekali; UI portfolio ada di mock lama tapi belum di-de-mock.
- [x] **Instrumen & Formula Editor (Superadmin)**
  - Dimensi/pernyataan/bobot ELIX saat ini di-hardcode di `data/constants.js`; superadmin belum bisa edit dinamis.
- [x] **Data Wilayah untuk Dropdown**
  - Provinsi/kota di form profil (`public/api-wilayah/*`) sengaja ditunda dari awal, dropdown-nya masih kosong. Cukup input teks manual sekarang.

## 🟢 Polish / Kualitas / Cleanups
- [x] **Alur edit user dari direktori**
  - Superadmin bisa lihat, tapi belum bisa demote/ubah role user existing selain approve.
- [x] **Notifikasi real-time** (WebSocket/polling)
- [x] **Ganti Google OAuth credential shared Clerk** → milikmu sendiri (biar pemilih akun jalan di jendela biasa, bukan cuma incognito).
- [x] **Cleanup file scratch** (`rewrite_page.cjs`, `runRewrite.cjs`, `test-neon-pool.cjs`) yang keikut commit.
