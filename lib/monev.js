// Utility & calculation helpers for MONEV: Penilaian Performa Mentor

export const SCORE_RUBRICS = {
  0: { label: 'Skor 0', range: '< 40%', desc: '< 40% tercapai / ada' },
  1: { label: 'Skor 1', range: '40% - 54%', desc: '40% - 54% tercapai / ada' },
  2: { label: 'Skor 2', range: '55% - 64%', desc: '55% - 64% tercapai / ada' },
  3: { label: 'Skor 3', range: '65% - 79%', desc: '65% - 79% tercapai / ada' },
  4: { label: 'Skor 4', range: '80% - 100%', desc: '80% - 100% tercapai / ada' },
};

export function getPerformanceCategory(score) {
  if (score == null || Number.isNaN(score)) {
    return { label: '—', tone: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  }
  const val = Number(score);
  if (val >= 85) {
    return {
      label: 'SANGAT BAIK',
      tone: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      badge: 'bg-emerald-500 text-white',
    };
  }
  if (val >= 70) {
    return {
      label: 'BAIK',
      tone: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
      badge: 'bg-sky-500 text-white',
    };
  }
  if (val >= 60) {
    return {
      label: 'CUKUP',
      tone: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      badge: 'bg-amber-500 text-slate-950',
    };
  }
  return {
    label: 'KURANG',
    tone: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    badge: 'bg-rose-500 text-white',
  };
}

/**
 * Menghitung nilai performa mentor skala 0 - 100:
 * - Nilai Semester 1 (dari butir SEMESTER_1 & KEDUANYA)
 * - Nilai Semester 2 (dari butir SEMESTER_2 & KEDUANYA)
 * - Total Nilai Performa 1 Tahun (akumulasi terbobot total skala 100)
 */
export function calculatePerformanceScores(targets = [], itemScores = {}) {
  let sem1WeightedSum = 0;
  let sem1TotalWeight = 0;

  let sem2WeightedSum = 0;
  let sem2TotalWeight = 0;

  let annualWeightedSum = 0;
  let annualTotalWeight = 0;

  for (const target of targets) {
    const tId = target.id;
    const weight = Number(target.weight) || 0;
    const scope = target.semesterScope || 'KEDUANYA';
    const entry = itemScores[tId] || {};

    const scoreSem1 = entry.scoreSem1 !== undefined ? Number(entry.scoreSem1) : null;
    const scoreSem2 = entry.scoreSem2 !== undefined ? Number(entry.scoreSem2) : null;

    annualTotalWeight += weight;

    // Evaluasi kontribusi Semester 1
    if (scope === 'SEMESTER_1' || scope === 'KEDUANYA') {
      sem1TotalWeight += weight;
      if (scoreSem1 !== null && !Number.isNaN(scoreSem1)) {
        // Kontribusi = (score / 4) * weight
        sem1WeightedSum += (scoreSem1 / 4) * weight;
      }
    }

    // Evaluasi kontribusi Semester 2
    if (scope === 'SEMESTER_2' || scope === 'KEDUANYA') {
      sem2TotalWeight += weight;
      if (scoreSem2 !== null && !Number.isNaN(scoreSem2)) {
        sem2WeightedSum += (scoreSem2 / 4) * weight;
      }
    }

    // Evaluasi kontribusi 1 Tahun untuk target ini
    if (scope === 'SEMESTER_1') {
      if (scoreSem1 !== null && !Number.isNaN(scoreSem1)) {
        annualWeightedSum += (scoreSem1 / 4) * weight;
      }
    } else if (scope === 'SEMESTER_2') {
      if (scoreSem2 !== null && !Number.isNaN(scoreSem2)) {
        annualWeightedSum += (scoreSem2 / 4) * weight;
      }
    } else {
      // Scope KEDUANYA: rata-rata capaian Sem 1 & Sem 2
      let avgScore = 0;
      let count = 0;
      if (scoreSem1 !== null && !Number.isNaN(scoreSem1)) {
        avgScore += scoreSem1;
        count++;
      }
      if (scoreSem2 !== null && !Number.isNaN(scoreSem2)) {
        avgScore += scoreSem2;
        count++;
      }
      if (count > 0) {
        annualWeightedSum += ((avgScore / count) / 4) * weight;
      }
    }
  }

  // Normalisasi ke skala 100
  const scoreSemester1 =
    sem1TotalWeight > 0 ? Number(((sem1WeightedSum / sem1TotalWeight) * 100).toFixed(2)) : null;

  const scoreSemester2 =
    sem2TotalWeight > 0 ? Number(((sem2WeightedSum / sem2TotalWeight) * 100).toFixed(2)) : null;

  const totalScore =
    annualTotalWeight > 0
      ? Number(((annualWeightedSum / annualTotalWeight) * 100).toFixed(2))
      : 0;

  const categoryObj = getPerformanceCategory(totalScore);

  return {
    scoreSemester1,
    scoreSemester2,
    totalScore,
    category: categoryObj.label,
    sem1TotalWeight,
    sem2TotalWeight,
    annualTotalWeight,
  };
}

// Template Bawaan Standar Rencana Kerja & Target Kerja (Total Bobot = 100%)
export const DEFAULT_PERFORMANCE_PLANS = [
  {
    title: 'Pembinaan & Pendampingan Karakter Awardee',
    order: 1,
    targets: [
      {
        title: 'Pembinaan Klasikal Bulanan',
        weight: 15,
        semesterScope: 'KEDUANYA',
        targetSemester: 'Terlaksana minimal 4 kali sesi pembinaan klasikal per semester dengan kehadiran awardee minimal 85%',
        order: 1,
      },
      {
        title: 'Pembinaan Individu / Mentoring 1-on-1',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetSemester: 'Terlaksana pendampingan individu 1-on-1 untuk setiap awardee binaan minimal 1 kali per semester',
        order: 2,
      },
      {
        title: 'Fasilitasi Presensi & Review Kehadiran Awardee',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetSemester: 'Rekap kehadiran seluruh awardee terverifikasi 100% tertib pada sistem portal',
        order: 3,
      },
    ],
  },
  {
    title: 'Pengelolaan Program & Aktivitas Wilayah',
    order: 2,
    targets: [
      {
        title: 'Pelaksanaan Ekselensia Leadership Camp / Outing Class / YES Day Out',
        weight: 15,
        semesterScope: 'SEMESTER_1',
        targetSemester: 'Terlaksana agenda kepemimpinan lapangan dan outbound wilayah sesuai modul dan arahan pusat',
        order: 4,
      },
      {
        title: 'Partisipasi Temu Tokoh, Book Sharing, & Talent Hub Class',
        weight: 15,
        semesterScope: 'SEMESTER_2',
        targetSemester: 'Awardee mengikuti minimal 2 agenda pengayaan wawasan / temu tokoh / talent hub per semester',
        order: 5,
      },
    ],
  },
  {
    title: 'Administrasi, Pelaporan & Publikasi Wilayah',
    order: 3,
    targets: [
      {
        title: 'Pengisian Jurnal Harian Mentor Day-by-Day',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetSemester: 'Mendokumentasikan seluruh aktivitas bimbingan secara rutin dan lengkap pada sistem Jurnal Mentor',
        order: 6,
      },
      {
        title: 'Laporan Keuangan & Administrasi Bulanan Wilayah',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetSemester: 'Laporan pertanggungjawaban operasional dan keuangan wilayah diserahkan tertib setiap bulan',
        order: 7,
      },
    ],
  },
  {
    title: 'Evaluasi & Pengembangan Kompetensi Mentor',
    order: 4,
    targets: [
      {
        title: 'Penilaian Siklus Mentor Assessment (MA) Awardee',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetSemester: 'Pengisian penilaian MA untuk seluruh awardee binaan tuntas 100% sebelum batas akhir siklus',
        order: 8,
      },
      {
        title: 'Kehadiran Weekly Meeting & Upgrading Mentor',
        weight: 5,
        semesterScope: 'KEDUANYA',
        targetSemester: 'Mengikuti rapat koordinasi mingguan dan sesi upgrading mentor nasional secara aktif',
        order: 9,
      },
    ],
  },
];
