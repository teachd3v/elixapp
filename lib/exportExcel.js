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
    'Mentor': mentorName || '—',
    'Wilayah': wilayahName || '—',
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


