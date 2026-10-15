import * as XLSX from 'xlsx';

export function exportSingleSessionAttendance({ session, attendances, filename }) {
  const name = filename || `Presensi_${(session?.title || 'Sesi').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  const rows = (attendances || []).map((r, idx) => ({
    'No': idx + 1,
    'Nama Awardee': r.awardee?.user?.name || '—',
    'Email': r.awardee?.user?.email || '—',
    'Wilayah': session?.wilayah?.name || (session?.scope === 'NASIONAL' ? 'Nasional' : '—'),
    'Judul Sesi': session?.title || '—',
    'Tanggal Sesi': session?.date ? new Date(session.date).toLocaleDateString('id-ID') : '—',
    'Status Presensi': r.status || '—',
    'Waktu Presensi': r.submittedAt ? new Date(r.submittedAt).toLocaleString('id-ID') : '—',
    'Catatan Hadir': r.notes || '—',
    'Kategori Izin': r.excuseCategory || '—',
    'Alasan Izin': r.excuseReason || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Keterangan': 'Belum ada data presensi' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Presensi');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 30 },
    { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 30 }
  ];

  XLSX.writeFile(workbook, name);
}

export async function exportSessionsAttendanceList({ sessions, filename = 'Rekap_Presensi_Sesi.xlsx' }) {
  const rows = [];
  
  for (const s of sessions) {
    try {
      const res = await fetch(`/api/sessions/${s.id}/attendance`);
      if (res.ok) {
        const atts = await res.json();
        for (const a of atts) {
          rows.push({
            'Wilayah': s.wilayah?.name || (s.scope === 'NASIONAL' ? 'Nasional' : '—'),
            'Judul Sesi': s.title || '—',
            'Kategori': s.category || 'KLASIKAL',
            'Tanggal Sesi': s.date ? new Date(s.date).toLocaleDateString('id-ID') : '—',
            'Nama Awardee': a.awardee?.user?.name || '—',
            'Email': a.awardee?.user?.email || '—',
            'Status Presensi': a.status || '—',
            'Waktu Presensi': a.submittedAt ? new Date(a.submittedAt).toLocaleString('id-ID') : '—',
            'Catatan Hadir': a.notes || '—',
            'Kategori Izin': a.excuseCategory || '—',
            'Alasan Izin': a.excuseReason || '—',
          });
        }
      }
    } catch (err) {
      console.error('Error fetching attendance for export:', err);
    }
  }

  if (rows.length === 0) {
    throw new Error('Belum ada data presensi yang masuk pada sesi-sesi ini.');
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Presensi');

  worksheet['!cols'] = [
    { wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
    { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 30 }
  ];

  XLSX.writeFile(workbook, filename);
}

export function exportAssessmentProgressToExcel({ periodName, rows, filename }) {
  const name = filename || `Rekap_Progres_Evaluasi_${(periodName || 'Siklus').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  const exportData = (rows || []).map((r, idx) => ({
    'No': idx + 1,
    'Nama Awardee': r.name || '—',
    'Email': r.email || '—',
    'No Handphone': r.phone || '—',
    'Wilayah': r.wilayah || '—',
    'Mentor': r.mentor || '—',
    'Siklus': periodName || '—',
    'Status SA': r.hasSA ? 'Sudah Diisi' : 'Belum Mengisi',
    'Skor SA (1-4)': r.hasSA ? Number(r.saScore).toFixed(2) : '—',
    'Status MA': r.hasMA ? 'Sudah Dinilai' : 'Belum Dinilai',
    'Skor MA (1-4)': r.hasMA ? Number(r.maScore).toFixed(2) : '—',
    'Indeks ELIX': r.elix != null ? Number(r.elix).toFixed(1) : '—',
    'Kategori': r.category || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData.length ? exportData : [{ 'Keterangan': 'Tidak ada data awardee' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Progres Evaluasi');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 18 },
    { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
    { wch: 14 }, { wch: 14 }, { wch: 20 }
  ];

  XLSX.writeFile(workbook, name);
}

export function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function exportMentorJournalsToExcel({ journals, mentorName, wilayahName, filename }) {
  const safeMentor = (mentorName || 'Mentor').replace(/[^a-zA-Z0-9]/g, '_');
  const name = filename || `Jurnal_Mentor_${safeMentor}.xlsx`;

  const exportData = (journals || []).map((j, idx) => ({
    'No': idx + 1,
    'Unique ID': j.journalCode || '—',
    'Nama Kegiatan': j.activityName || '—',
    'Tanggal Pelaksanaan (DD/MM/YYYY)': formatDateDDMMYYYY(j.activityDate),
    'Waktu Pelaksanaan (24 Jam)': j.activityTime || '—',
    'Tipe Tempat': j.locationType || '—',
    'Detail Tempat Pelaksanaan': j.locationDetail || '—',
    'Capaian Kualitatif': j.qualitativeAchievement || '—',
    'Capaian Kuantitatif': j.quantitativeAchievement || '—',
    'Identifikasi Masalah': j.problemIdentification || '—',
    'Rencana Perbaikan': j.improvementPlan || '—',
    'Evidence (Teks / Tautan)': j.evidenceText || '—',
    'Status Foto Dokumentasi': j.evidencePhoto ? 'Ada Foto Terlampir' : 'Tidak Ada Foto',
    'Mentor': j.mentor?.user?.name || mentorName || '—',
    'Wilayah': j.mentor?.wilayah?.name || wilayahName || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(
    exportData.length ? exportData : [{ 'Keterangan': 'Belum ada data jurnal mentor' }]
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jurnal Mentor');

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 20 }, // Unique ID
    { wch: 28 }, // Nama Kegiatan
    { wch: 18 }, // Tanggal
    { wch: 18 }, // Waktu
    { wch: 12 }, // Tipe Tempat
    { wch: 28 }, // Detail Tempat
    { wch: 40 }, // Capaian Kualitatif
    { wch: 35 }, // Capaian Kuantitatif
    { wch: 40 }, // Identifikasi Masalah
    { wch: 40 }, // Rencana Perbaikan
    { wch: 30 }, // Evidence Teks
    { wch: 20 }, // Status Foto
    { wch: 22 }, // Mentor
    { wch: 18 }, // Wilayah
  ];

  XLSX.writeFile(workbook, name);
}

export function exportMonevPerformanceTemplate(filename = 'Template_Instrumen_Performa_Mentor.xlsx') {
  const rows = [
    {
      'No': 1,
      'Rencana Kerja': 'Pembinaan & Pendampingan Karakter Awardee',
      'Target Kerja': 'Pembinaan Klasikal Bulanan',
      'Bobot (%)': 15,
      'Penilaian Semester': 'Semester 1 & 2',
      'Target Capaian Sem 1': 4.0,
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Terlaksana minimal 4 kali sesi pembinaan klasikal per semester dengan kehadiran awardee minimal 85%'
    },
    {
      'No': 2,
      'Rencana Kerja': 'Pembinaan & Pendampingan Karakter Awardee',
      'Target Kerja': 'Pembinaan Individu / Mentoring 1-on-1',
      'Bobot (%)': 10,
      'Penilaian Semester': 'Semester 1 & 2',
      'Target Capaian Sem 1': 3.5,
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Terlaksana pendampingan individu 1-on-1 untuk setiap awardee binaan minimal 1 kali per semester'
    },
    {
      'No': 3,
      'Rencana Kerja': 'Pembinaan & Pendampingan Karakter Awardee',
      'Target Kerja': 'Fasilitasi Presensi & Review Kehadiran Awardee',
      'Bobot (%)': 10,
      'Penilaian Semester': 'Semester 1 & 2',
      'Target Capaian Sem 1': 4.0,
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Rekap kehadiran seluruh awardee terverifikasi 100% tertib pada sistem portal'
    },
    {
      'No': 4,
      'Rencana Kerja': 'Pengelolaan Program & Aktivitas Wilayah',
      'Target Kerja': 'Pelaksanaan Ekselensia Leadership Camp / Outing Class / YES Day Out',
      'Bobot (%)': 15,
      'Penilaian Semester': 'Semester 1',
      'Target Capaian Sem 1': 4.0,
      'Target Capaian Sem 2': '',
      'Deskripsi / Indikator Capaian': 'Terlaksana agenda kepemimpinan lapangan dan outbound wilayah sesuai modul dan arahan pusat'
    },
    {
      'No': 5,
      'Rencana Kerja': 'Pengelolaan Program & Aktivitas Wilayah',
      'Target Kerja': 'Partisipasi Temu Tokoh, Book Sharing, & Talent Hub Class',
      'Bobot (%)': 15,
      'Penilaian Semester': 'Semester 2',
      'Target Capaian Sem 1': '',
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Awardee mengikuti minimal 2 agenda pengayaan wawasan / temu tokoh / talent hub per semester'
    },
    {
      'No': 6,
      'Rencana Kerja': 'Administrasi, Pelaporan & Publikasi Wilayah',
      'Target Kerja': 'Pengisian Jurnal Harian Mentor Day-by-Day',
      'Bobot (%)': 10,
      'Penilaian Semester': 'Semester 1 & 2',
      'Target Capaian Sem 1': 3.5,
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Mendokumentasikan seluruh aktivitas bimbingan secara rutin dan lengkap pada sistem Jurnal Mentor'
    },
    {
      'No': 7,
      'Rencana Kerja': 'Administrasi, Pelaporan & Publikasi Wilayah',
      'Target Kerja': 'Laporan Keuangan & Administrasi Bulanan Wilayah',
      'Bobot (%)': 10,
      'Penilaian Semester': 'Semester 1 & 2',
      'Target Capaian Sem 1': 4.0,
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Laporan pertanggungjawaban operasional dan keuangan wilayah diserahkan tertib setiap bulan'
    },
    {
      'No': 8,
      'Rencana Kerja': 'Evaluasi & Pengembangan Kompetensi Mentor',
      'Target Kerja': 'Penilaian Siklus Mentor Assessment (MA) Awardee',
      'Bobot (%)': 10,
      'Penilaian Semester': 'Semester 1 & 2',
      'Target Capaian Sem 1': 4.0,
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Pengisian penilaian MA untuk seluruh awardee binaan tuntas 100% sebelum batas akhir siklus'
    },
    {
      'No': 9,
      'Rencana Kerja': 'Evaluasi & Pengembangan Kompetensi Mentor',
      'Target Kerja': 'Kehadiran Weekly Meeting & Upgrading Mentor',
      'Bobot (%)': 5,
      'Penilaian Semester': 'Semester 1 & 2',
      'Target Capaian Sem 1': 4.0,
      'Target Capaian Sem 2': 4.0,
      'Deskripsi / Indikator Capaian': 'Mengikuti rapat koordinasi mingguan dan sesi upgrading mentor nasional secara aktif'
    }
  ];

  const guideRows = [
    { 'Kolom': 'No', 'Status': 'Opsional', 'Format / Nilai': 'Nomor urut baris' },
    { 'Kolom': 'Rencana Kerja', 'Status': 'Wajib', 'Format / Nilai': 'Nama rencana kerja induk. Jika baris berikutnya memiliki nama yang sama atau dikosongkan, otomatis tergabung ke rencana kerja ini.' },
    { 'Kolom': 'Target Kerja', 'Status': 'Wajib', 'Format / Nilai': 'Nama butir target kerja yang akan dinilai performanya' },
    { 'Kolom': 'Bobot (%)', 'Status': 'Wajib', 'Format / Nilai': 'Nilai angka bobot (misal: 15). Akumulasi seluruh target kerja wajib bernilai 100%' },
    { 'Kolom': 'Penilaian Semester', 'Status': 'Wajib', 'Format / Nilai': 'Pilihan: "Semester 1 & 2" (atau "Keduanya"), "Semester 1", atau "Semester 2"' },
    { 'Kolom': 'Target Capaian Sem 1', 'Status': 'Wajib jika ada Sem 1', 'Format / Nilai': 'Target nilai yang diharapkan pada Semester 1 (Angka desimal 0.00 s/d 4.00, misal: 3.50 atau 4.00)' },
    { 'Kolom': 'Target Capaian Sem 2', 'Status': 'Wajib jika ada Sem 2', 'Format / Nilai': 'Target nilai yang diharapkan pada Semester 2 (Angka desimal 0.00 s/d 4.00, misal: 4.00)' },
    { 'Kolom': 'Deskripsi / Indikator Capaian', 'Status': 'Opsional', 'Format / Nilai': 'Penjelasan deskriptif target capaian atau indikator pelaksanaan' }
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 42 },
    { wch: 12 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 60 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Instrumen Performa');

  const guideSheet = XLSX.utils.json_to_sheet(guideRows);
  guideSheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 65 }
  ];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Petunjuk Pengisian');

  XLSX.writeFile(workbook, filename);
}

export function exportMonevTeachingTemplate(filename = 'Template_Instrumen_Kompetensi_Mengajar.xlsx') {
  const rows = [
    {
      'No': 1,
      'Aspek': 'Penguasaan Materi & Kurikulum',
      'Indikator': 'Menguasai konsep dan materi bimbingan kepemimpinan secara mendalam dan sistematis',
      'Skor': 4.0,
      'Catatan': 'Contoh catatan panduan'
    },
    {
      'No': 2,
      'Aspek': 'Penguasaan Materi & Kurikulum',
      'Indikator': 'Mengaitkan materi pembelajaran dengan studi kasus atau dinamika riil awardee',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 3,
      'Aspek': 'Metodologi & Keterampilan Mengajar',
      'Indikator': 'Membuka sesi dengan apersepsi menarik, motivasi, dan kejelasan tujuan bimbingan',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 4,
      'Aspek': 'Metodologi & Keterampilan Mengajar',
      'Indikator': 'Menerapkan variasi metode interaktif (diskusi kelompok, tanya jawab, atau simulasi)',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 5,
      'Aspek': 'Komunikasi & Interaksi dengan Awardee',
      'Indikator': 'Menyampaikan materi dengan artikulasi jelas, bahasa persuasif, dan nada positif',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 6,
      'Aspek': 'Komunikasi & Interaksi dengan Awardee',
      'Indikator': 'Mendorong partisipasi aktif seluruh awardee secara inklusif tanpa dominasi sepihak',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 7,
      'Aspek': 'Pengelolaan Kelas & Waktu (Time Management)',
      'Indikator': 'Memulai dan menyelesaikan sesi pembinaan tepat waktu sesuai alokasi jadwal',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 8,
      'Aspek': 'Pengelolaan Kelas & Waktu (Time Management)',
      'Indikator': 'Menjaga dinamika kelas tetap fokus, antusias, dan kondusif sepanjang durasi',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 9,
      'Aspek': 'Evaluasi & Umpan Balik (Feedback)',
      'Indikator': 'Memberikan tanggapan dan apresiasi konstruktif terhadap opini atau pertanyaan awardee',
      'Skor': 4.0,
      'Catatan': ''
    },
    {
      'No': 10,
      'Aspek': 'Evaluasi & Umpan Balik (Feedback)',
      'Indikator': 'Melakukan reviu pemahaman dan merangkum poin-poin kunci di akhir sesi',
      'Skor': 4.0,
      'Catatan': ''
    }
  ];

  const guideRows = [
    { 'Kolom': 'No', 'Status': 'Opsional', 'Format / Nilai': 'Nomor urut baris' },
    { 'Kolom': 'Aspek', 'Status': 'Wajib', 'Format / Nilai': 'Nama aspek kompetensi mengajar. Jika baris berikutnya memiliki nama yang sama atau dikosongkan, otomatis tergabung ke aspek ini.' },
    { 'Kolom': 'Indikator', 'Status': 'Wajib', 'Format / Nilai': 'Butir pernyataan/indikator pengamatan kualitas mengajar' },
    { 'Kolom': 'Skor', 'Status': 'Wajib', 'Format / Nilai': 'Nilai poin angka (misal: 4.0 atau 1.0) yang diperoleh jika indikator dicentang' },
    { 'Kolom': 'Catatan', 'Status': 'Opsional', 'Format / Nilai': 'Catatan panduan atau keterangan tambahan' }
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 70 },
    { wch: 12 },
    { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Instrumen Kompetensi Mengajar');

  const guideSheet = XLSX.utils.json_to_sheet(guideRows);
  guideSheet['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 75 }
  ];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Petunjuk Pengisian');

  XLSX.writeFile(workbook, filename);
}

export function exportMonevInterviewTemplate(filename = 'Template_Instrumen_Wawancara_Awardee.xlsx') {
  const rows = [
    {
      'No': 1,
      'Aspek': 'Academic Readiness',
      'Pertanyaan': 'Bagaimana perkembangan perkuliahan, adaptasi semester ini, dan pencapaian target IPK Anda?',
      'Panduan': 'Eksplorasi kendala mata kuliah, IPK berjalan vs target, dan relasi dengan dosen/rekan kampus.'
    },
    {
      'No': 2,
      'Aspek': 'Academic Readiness',
      'Pertanyaan': 'Kendala akademik apa yang paling menantang dan bagaimana Anda membagi waktu antara kuliah dan kegiatan pembinaan YES?',
      'Panduan': 'Fokus pada time management, prioritas tugas, dan mitigasi bentrok jadwal.'
    },
    {
      'No': 3,
      'Aspek': 'Islamic Character',
      'Pertanyaan': 'Bagaimana konsistensi pelaksanaan ibadah harian (sholat 5 waktu berjamaah, rawatib, dhuha, qiyamullail, dan shaum sunnah)?',
      'Panduan': 'Tinjau mutabaah yaumiyah dan rutinitas ruhiyah pribadi awardee.'
    },
    {
      'No': 4,
      'Aspek': 'Islamic Character',
      'Pertanyaan': 'Bagaimana penerapan adab islami, akhlak, dan integritas Anda dalam kehidupan bermasyarakat dan pergaulan di kampus?',
      'Panduan': 'Eksplorasi etika pergaulan, penjagaan pandangan/interaksi, serta kejujuran dalam studi.'
    },
    {
      'No': 5,
      'Aspek': 'Quranic Development',
      'Pertanyaan': 'Bagaimana capaian target tilawah harian serta progres hafalan (tahfidz) Al-Qur\'an selama semester ini?',
      'Panduan': 'Tanyakan jumlah juz/halaman yang berhasil dihafal serta keteraturan one day one juz.'
    },
    {
      'No': 6,
      'Aspek': 'Quranic Development',
      'Pertanyaan': 'Metode apa yang Anda gunakan untuk menjaga kelancaran (mutqin) hafalan dan apa kendala yang dihadapi dalam muraja\'ah?',
      'Panduan': 'Cari tahu jadwal muraja\'ah mandiri atau tasmi\' bersama rekan/mentor.'
    },
    {
      'No': 7,
      'Aspek': 'Self Mastery',
      'Pertanyaan': 'Bagaimana cara Anda mengelola emosi, stres akademik/pribadi, dan menjaga motivasi belajar tetap tinggi?',
      'Panduan': 'Eksplorasi mekanisme koping saat menghadapi masalah atau tekanan beban tugas.'
    },
    {
      'No': 8,
      'Aspek': 'Self Mastery',
      'Pertanyaan': 'Perubahan kebiasaan positif dan pengembangan karakter apa yang paling Anda rasakan sejak bergabung dalam pembinaan YES?',
      'Panduan': 'Tinjau kedisiplinan bangun pagi, kerapihan, kemandirian finansial sederhana, atau habits baru.'
    },
    {
      'No': 9,
      'Aspek': 'Social Impact Leadership',
      'Pertanyaan': 'Apa peran, keaktifan organisasi, atau kontribusi kerelawanan yang sedang Anda jalankan di kampus maupun masyarakat?',
      'Panduan': 'Catat nama organisasi, posisi/amanah, dan kontribusi nyata yang diberikan.'
    },
    {
      'No': 10,
      'Aspek': 'Social Impact Leadership',
      'Pertanyaan': 'Bagaimana rencana atau realisasi proyek sosial (social impact) Anda yang bermanfaat bagi lingkungan sekitar?',
      'Panduan': 'Eksplorasi kepekaan sosial awardee dalam menginisiasi solusi atas masalah di sekitarnya.'
    },
    {
      'No': 11,
      'Aspek': 'Mentor',
      'Pertanyaan': 'Bagaimana frekuensi komunikasi, kenyamanan berdiskusi, dan keterbukaan Anda bersama mentor wilayah?',
      'Panduan': 'Eksplorasi apakah awardee merasa nyaman curhat/konsultasi atau ada jarak komunikasi.'
    },
    {
      'No': 12,
      'Aspek': 'Mentor',
      'Pertanyaan': 'Apa saran, masukan, atau harapan Anda terhadap bimbingan dan pendampingan yang diberikan oleh mentor?',
      'Panduan': 'Gali feedback konstruktif terkait materi pembinaan, metode mentoring, atau kepedulian mentor.'
    }
  ];

  const guideRows = [
    { 'Kolom': 'No', 'Status': 'Opsional', 'Format / Nilai': 'Nomor urut baris' },
    { 'Kolom': 'Aspek', 'Status': 'Wajib', 'Format / Nilai': 'Nama aspek wawancara (contoh: Academic Readiness, Islamic Character, Quranic Development, Self Mastery, Social Impact Leadership, Mentor). Baris dengan aspek yang sama otomatis dikelompokkan.' },
    { 'Kolom': 'Pertanyaan', 'Status': 'Wajib', 'Format / Nilai': 'Teks butir pertanyaan wawancara indepth untuk awardee.' },
    { 'Kolom': 'Panduan', 'Status': 'Opsional', 'Format / Nilai': 'Catatan panduan atau petunjuk bagi pewawancara/observer saat menggali jawaban awardee.' }
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 75 },
    { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Instrumen Wawancara Awardee');

  const guideSheet = XLSX.utils.json_to_sheet(guideRows);
  guideSheet['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 75 }
  ];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Petunjuk Pengisian');

  XLSX.writeFile(workbook, filename);
}

export function exportMonevObservationTemplate(filename = 'Template_Instrumen_Observasi_Wilayah.xlsx') {
  const rows = [
    {
      'No': 1,
      'Bagian': 'Bagian A. Perkembangan Program',
      'Aspek': 'Realisasi Pelaksanaan Program',
      'Deskripsi Aspek': 'Kesimpulan dan evaluasi pelaksanaan seluruh agenda program YES di wilayah mengacu pada keseluruhan instrumen monev.',
    },
    {
      'No': 2,
      'Bagian': 'Bagian A. Perkembangan Program',
      'Aspek': 'Performa Mentor',
      'Deskripsi Aspek': 'Kesimpulan kualitas pendampingan, kepemimpinan, dan administrasi mentor wilayah mengacu pada Instrumen Penilaian Mentor dan Mengajar Mentor.',
    },
    {
      'No': 3,
      'Bagian': 'Bagian A. Perkembangan Program',
      'Aspek': 'Kondisi & Perkembangan Awardee',
      'Deskripsi Aspek': 'Dinamika keaktifan, kedisiplinan pembinaan, komitmen, dan perkembangan capaian awardee di wilayah.',
    },
    {
      'No': 4,
      'Bagian': 'Bagian B. Temuan Ketidakcapaian Target Program',
      'Aspek': 'Target Capaian Akademik & Prestasi',
      'Deskripsi Aspek': 'Kategori temuan terkait capaian akademik atau prestasi awardee di kampus.',
    },
    {
      'No': 5,
      'Bagian': 'Bagian B. Temuan Ketidakcapaian Target Program',
      'Aspek': 'Kedisiplinan & Kehadiran Sesi Pembinaan',
      'Deskripsi Aspek': 'Kategori temuan terkait presensi sesi bimbingan dan keterlibatan aktif awardee/mentor.',
    },
    {
      'No': 6,
      'Bagian': 'Bagian B. Temuan Ketidakcapaian Target Program',
      'Aspek': 'Tata Kelola Wilayah & Kemitraan Kampus',
      'Deskripsi Aspek': 'Kategori temuan sarana prasarana, relasi kemitraan kampus, dan lingkungan pembinaan wilayah.',
    },
  ];

  const guideRows = [
    { 'Kolom': 'No', 'Status': 'Wajib', 'Format / Nilai': 'Nomor urut aspek (angka 1, 2, 3, dst.)' },
    { 'Kolom': 'Bagian', 'Status': 'Wajib', 'Format / Nilai': '"Bagian A. Perkembangan Program" (atau Bagian A) / "Bagian B. Temuan Ketidakcapaian Target Program" (atau Bagian B)' },
    { 'Kolom': 'Aspek', 'Status': 'Wajib', 'Format / Nilai': 'Nama aspek pengamatan observasi' },
    { 'Kolom': 'Deskripsi Aspek', 'Status': 'Opsional', 'Format / Nilai': 'Deskripsi atau penjelasan singkat mengenai aspek tersebut' },
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 45 },
    { wch: 40 },
    { wch: 85 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Instrumen Observasi Wilayah');

  const guideSheet = XLSX.utils.json_to_sheet(guideRows);
  guideSheet['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 85 },
  ];
  XLSX.writeFile(workbook, filename);
}

export function exportMonevPerformanceRecapToExcel({ mentors, filename = 'Rekap_Performa_Mentor.xlsx' }) {
  const exportData = (mentors || []).map((m, idx) => {
    const evals = m.performanceEvaluations || [];
    const latest = evals[0] || null;
    let categoryText = '—';
    if (latest?.totalScore != null) {
      const val = Number(latest.totalScore);
      if (val >= 85) categoryText = 'SANGAT BAIK';
      else if (val >= 70) categoryText = 'BAIK';
      else if (val >= 60) categoryText = 'CUKUP';
      else categoryText = 'KURANG';
    }

    return {
      'No': idx + 1,
      'Nama Mentor': m.user?.name || '—',
      'Email': m.user?.email || '—',
      'No Handphone': m.user?.phone || '—',
      'Wilayah': m.wilayah?.name || '—',
      'Status Penilaian': latest ? 'Sudah Dinilai' : 'Belum Dinilai',
      'Periode': latest?.period?.name || '—',
      'Skor Akhir (0-100)': latest ? Number(latest.totalScore).toFixed(1) : '—',
      'Predikat': categoryText,
      'Tanggal Penilaian': latest?.evaluatedAt ? formatDateDDMMYYYY(latest.evaluatedAt) : '—',
      'Observer / Penilai': latest?.evaluator?.name || '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(
    exportData.length ? exportData : [{ 'Keterangan': 'Tidak ada data mentor' }]
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Performa Mentor');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 18 },
    { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }
  ];

  XLSX.writeFile(workbook, filename);
}

export function exportMonevTeachingRecapToExcel({ mentors, filename = 'Rekap_Kompetensi_Mengajar.xlsx' }) {
  const exportData = (mentors || []).map((m, idx) => {
    const evals = m.teachingEvaluations || [];
    const latest = evals[0] || null;
    let predikat = '—';
    if (latest?.percentage != null) {
      const pct = Number(latest.percentage);
      if (pct >= 85) predikat = 'SANGAT BAIK';
      else if (pct >= 70) predikat = 'BAIK';
      else if (pct >= 60) predikat = 'CUKUP';
      else predikat = 'KURANG';
    }

    return {
      'No': idx + 1,
      'Nama Mentor': m.user?.name || '—',
      'Email': m.user?.email || '—',
      'No Handphone': m.user?.phone || '—',
      'Wilayah': m.wilayah?.name || '—',
      'Status Evaluasi': latest ? 'Sudah Diobservasi' : 'Belum Diobservasi',
      'Periode': latest?.period?.name || '—',
      'Skor Capaian': latest ? latest.totalScore : '—',
      'Skor Maksimal': latest ? latest.maxScore : '—',
      'Persentase (%)': latest ? `${Number(latest.percentage).toFixed(1)}%` : '—',
      'Predikat': predikat,
      'Tanggal Evaluasi': latest?.evaluatedAt ? formatDateDDMMYYYY(latest.evaluatedAt) : '—',
      'Observer / Penilai': latest?.evaluator?.name || '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(
    exportData.length ? exportData : [{ 'Keterangan': 'Tidak ada data mentor' }]
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kompetensi Mengajar');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 18 }, { wch: 18 }, { wch: 25 }
  ];

  XLSX.writeFile(workbook, filename);
}

export function exportMonevObservationRecapToExcel({ wilayahCards, filename = 'Rekap_Observasi_Wilayah.xlsx' }) {
  const exportData = (wilayahCards || []).map((w, idx) => {
    const latest = w.latestObs;
    const findingsCount = Array.isArray(latest?.findings) ? latest.findings.length : 0;
    const mentorList = (w.mentorNames && w.mentorNames.join(', ')) ||
      (w.mentors?.map(m => m.user?.name).filter(Boolean).join(', ')) || '—';

    return {
      'No': idx + 1,
      'Wilayah': w.name || '—',
      'Mentor Pendamping': mentorList,
      'Status Observasi': w.hasObservation ? 'Sudah Diobservasi' : 'Belum Diobservasi',
      'Periode': latest?.period?.name || '—',
      'Jumlah Temuan': w.hasObservation ? findingsCount : 0,
      'Tanggal Observasi': latest?.observationDate ? formatDateDDMMYYYY(latest.observationDate) : '—',
      'Observer / Penilai': latest?.observer?.name || '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(
    exportData.length ? exportData : [{ 'Keterangan': 'Tidak ada data wilayah' }]
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Observasi Wilayah');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 20 },
    { wch: 16 }, { wch: 18 }, { wch: 25 }
  ];

  XLSX.writeFile(workbook, filename);
}

export function exportMonevInterviewRecapToExcel({ awardees, filename = 'Rekap_Wawancara_Awardee.xlsx' }) {
  const exportData = (awardees || []).map((a, idx) => {
    const recs = a.interviewRecords || [];
    const latest = recs[0] || null;
    return {
      'No': idx + 1,
      'Nama Awardee': a.name || a.user?.name || '—',
      'Email': a.user?.email || '—',
      'Wilayah': a.wilayah?.name || '—',
      'Nama Sekolah': a.school || a.university || '—',
      'Jurusan': a.major || '—',
      'Angkatan': a.generation ? `Angkatan ${a.generation}` : (a.batch ? `Angkatan ${a.batch}` : '—'),
      'Status Wawancara': latest ? 'Sudah Diwawancara' : 'Belum Diwawancara',
      'Periode': latest?.period?.name || '—',
      'Tanggal Wawancara': latest?.interviewDate ? formatDateDDMMYYYY(latest.interviewDate) : '—',
      'Observer / Pewawancara': latest?.interviewer?.name || '—',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(
    exportData.length ? exportData : [{ 'Keterangan': 'Tidak ada data awardee' }]
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Wawancara Awardee');

  worksheet['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 25 },
    { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 25 }
  ];

  XLSX.writeFile(workbook, filename);
}
