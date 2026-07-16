# Roadmap Pengembangan ELIX App

Berikut adalah daftar prioritas fitur yang perlu dikerjakan berdasarkan roadmap sebelumnya. Silakan centang (`[x]`) fitur yang sudah diselesaikan.

## 🔴 Fitur Inti Produk (Belum ada backend-nya)
Ini "cara program beroperasi tiap minggu" — tanpa ini, app cuma bisa nilai SA/MA sekali doang.

- [ ] **Sesi Pembinaan** (Model `Session` sudah ada, 0 API/UI real)
  - [ ] Mentor bikin/edit/hapus jadwal sesi wilayahnya
  - [ ] Superadmin bikin sesi nasional
  - [ ] Awardee lihat sesi mendatang
- [ ] **Absensi** (Model `Attendance` sudah ada, 0 API/UI real)
  - [ ] Awardee submit kehadiran (selfie + foto suasana yang ada di kode mock lama)
  - [ ] Mentor verifikasi/tolak (MENUNGGU_KONFIRMASI → HADIR/ALFA)
  - [ ] Superadmin kelola presensi lintas wilayah
- [ ] **Izin** (Model `Excuse` sudah ada, 0 API/UI real)
  - [ ] Awardee ajukan izin dengan alasan + bukti
  - [ ] Mentor approve/reject (PENDING → APPROVED/REJECTED)
- [ ] **Pengumuman** (Model `Announcement` sudah ada, 0 API/UI real)
  - [ ] Mentor kirim ke awardee di wilayahnya
  - [ ] Superadmin kirim nasional/per wilayah
  - [ ] Notifikasi & bel di header awardee/mentor

## 🟡 Fitur Menengah (Lebih ringan tapi belum)
- [ ] **Portfolio Awardee**
  - Belum ada model Prisma sama sekali; UI portfolio ada di mock lama tapi belum di-de-mock.
- [ ] **Instrumen & Formula Editor (Superadmin)**
  - Dimensi/pernyataan/bobot ELIX saat ini di-hardcode di `data/constants.js`; superadmin belum bisa edit dinamis.
- [ ] **Data Wilayah untuk Dropdown**
  - Provinsi/kota di form profil (`public/api-wilayah/*`) sengaja ditunda dari awal, dropdown-nya masih kosong. Cukup input teks manual sekarang.

## 🟢 Polish / Kualitas / Cleanups
- [ ] **Alur edit user dari direktori**
  - Superadmin bisa lihat, tapi belum bisa demote/ubah role user existing selain approve.
- [ ] **Notifikasi real-time** (WebSocket/polling)
- [ ] **Ganti Google OAuth credential shared Clerk** → milikmu sendiri (biar pemilih akun jalan di jendela biasa, bukan cuma incognito).
- [x] **Cleanup file scratch** (`rewrite_page.cjs`, `runRewrite.cjs`, `test-neon-pool.cjs`) yang keikut commit.
