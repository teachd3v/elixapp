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
        targetScoreSem1: 4.0,
        targetScoreSem2: 4.0,
        targetSemester: 'Terlaksana minimal 4 kali sesi pembinaan klasikal per semester dengan kehadiran awardee minimal 85%',
        order: 1,
      },
      {
        title: 'Pembinaan Individu / Mentoring 1-on-1',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetScoreSem1: 3.5,
        targetScoreSem2: 4.0,
        targetSemester: 'Terlaksana pendampingan individu 1-on-1 untuk setiap awardee binaan minimal 1 kali per semester',
        order: 2,
      },
      {
        title: 'Fasilitasi Presensi & Review Kehadiran Awardee',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetScoreSem1: 4.0,
        targetScoreSem2: 4.0,
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
        targetScoreSem1: 4.0,
        targetScoreSem2: null,
        targetSemester: 'Terlaksana agenda kepemimpinan lapangan dan outbound wilayah sesuai modul dan arahan pusat',
        order: 4,
      },
      {
        title: 'Partisipasi Temu Tokoh, Book Sharing, & Talent Hub Class',
        weight: 15,
        semesterScope: 'SEMESTER_2',
        targetScoreSem1: null,
        targetScoreSem2: 4.0,
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
        targetScoreSem1: 3.5,
        targetScoreSem2: 4.0,
        targetSemester: 'Mendokumentasikan seluruh aktivitas bimbingan secara rutin dan lengkap pada sistem Jurnal Mentor',
        order: 6,
      },
      {
        title: 'Laporan Keuangan & Administrasi Bulanan Wilayah',
        weight: 10,
        semesterScope: 'KEDUANYA',
        targetScoreSem1: 4.0,
        targetScoreSem2: 4.0,
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
        targetScoreSem1: 4.0,
        targetScoreSem2: 4.0,
        targetSemester: 'Pengisian penilaian MA untuk seluruh awardee binaan tuntas 100% sebelum batas akhir siklus',
        order: 8,
      },
      {
        title: 'Kehadiran Weekly Meeting & Upgrading Mentor',
        weight: 5,
        semesterScope: 'KEDUANYA',
        targetScoreSem1: 4.0,
        targetScoreSem2: 4.0,
        targetSemester: 'Mengikuti rapat koordinasi mingguan dan sesi upgrading mentor nasional secara aktif',
        order: 9,
      },
    ],
  },
];

/**
 * Mem-parsing baris spreadsheet Excel menjadi struktur Plans & Targets
 * Mendukung fleksibilitas penamaan kolom dan pengisian baris secara cerdas.
 */
export function parseExcelPerformancePlans(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { plans: [], totalWeight: 0, totalTargets: 0, errors: ['File Excel kosong atau tidak memiliki baris data.'] };
  }

  const plansMap = new Map();
  let currentPlanTitle = '';
  const errors = [];
  let planOrderCounter = 1;
  let targetOrderCounter = 1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Baris 1 biasanya header di Excel

    // Cari key secara case-insensitive & flexible
    const findVal = (patterns) => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.trim().toLowerCase();
        for (const p of patterns) {
          if (cleanKey === p || cleanKey.includes(p)) {
            const v = row[key];
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              return String(v).trim();
            }
          }
        }
      }
      return null;
    };

    const parseScore = (val) => {
      if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-') return null;
      const num = parseFloat(String(val).replace(',', '.'));
      if (Number.isNaN(num)) return null;
      return Math.min(4.0, Math.max(0.0, Math.round(num * 100) / 100));
    };

    const rawPlanTitle = findVal(['rencana kerja', 'rencana', 'program', 'kategori']);
    const rawTargetTitle = findVal(['target kerja', 'target', 'kegiatan', 'aktivitas', 'indikator']);
    const rawWeight = findVal(['bobot (%)', 'bobot', 'persentase', 'weight']);
    const rawSemester = findVal(['penilaian semester', 'semester', 'cakupan semester', 'scope']);

    // Update currentPlanTitle jika terisi di baris ini
    if (rawPlanTitle) {
      currentPlanTitle = rawPlanTitle;
    }

    // Jika target kerja kosong, skip jika baris sepenuhnya kosong
    if (!rawTargetTitle) {
      if (!rawPlanTitle && !rawWeight) continue;
      errors.push(`Baris ${rowNum}: Target Kerja tidak boleh kosong.`);
      continue;
    }

    if (!currentPlanTitle) {
      errors.push(`Baris ${rowNum}: Rencana Kerja induk belum ditentukan untuk target "${rawTargetTitle}".`);
      continue;
    }

    // Parsing bobot
    let weight = 0;
    if (rawWeight) {
      const cleaned = String(rawWeight).replace('%', '').trim().replace(',', '.');
      const parsed = parseFloat(cleaned);
      if (!Number.isNaN(parsed)) {
        if (parsed > 0 && parsed <= 1 && !String(rawWeight).includes('%')) {
          weight = Math.round(parsed * 100 * 10) / 10;
        } else {
          weight = Math.round(parsed * 10) / 10;
        }
      }
    }

    if (weight <= 0) {
      errors.push(`Baris ${rowNum}: Bobot untuk "${rawTargetTitle}" harus berupa angka positif.`);
    }

    // Parsing semester scope
    let semesterScope = 'KEDUANYA';
    if (rawSemester) {
      const s = rawSemester.toLowerCase();
      if (s.includes('1') && !s.includes('2')) {
        semesterScope = 'SEMESTER_1';
      } else if (s.includes('2') && !s.includes('1')) {
        semesterScope = 'SEMESTER_2';
      } else {
        semesterScope = 'KEDUANYA';
      }
    }

    // Parsing Target Capaian Nilai (0.00 - 4.00)
    let targetScoreSem1 = parseScore(
      findVal(['target capaian sem 1', 'target capaian semester 1', 'target sem 1', 'target capaian 1', 'target score sem 1', 'target sem1'])
    );
    let targetScoreSem2 = parseScore(
      findVal(['target capaian sem 2', 'target capaian semester 2', 'target sem 2', 'target capaian 2', 'target score sem 2', 'target sem2'])
    );

    // Fallback jika ada kolom target tunggal
    const rawSingleTarget = findVal(['target capaian semester', 'target capaian', 'target nilai']);
    if (rawSingleTarget) {
      const parsedSingle = parseScore(rawSingleTarget);
      if (parsedSingle !== null) {
        if (targetScoreSem1 === null) targetScoreSem1 = parsedSingle;
        if (targetScoreSem2 === null) targetScoreSem2 = parsedSingle;
      }
    }

    // Default nilai target (0.00 - 4.00) jika belum diset
    if (semesterScope === 'SEMESTER_1' || semesterScope === 'KEDUANYA') {
      if (targetScoreSem1 === null) targetScoreSem1 = 4.0;
    } else {
      targetScoreSem1 = null;
    }

    if (semesterScope === 'SEMESTER_2' || semesterScope === 'KEDUANYA') {
      if (targetScoreSem2 === null) targetScoreSem2 = 4.0;
    } else {
      targetScoreSem2 = null;
    }

    // Deskripsi / Indikator Capaian (opsional)
    const rawDesc = findVal(['deskripsi', 'indikator', 'keterangan', 'indikator capaian']);
    const targetSemester = rawDesc || (rawSingleTarget && parseScore(rawSingleTarget) === null ? rawSingleTarget : null);

    if (!plansMap.has(currentPlanTitle)) {
      plansMap.set(currentPlanTitle, {
        title: currentPlanTitle,
        order: planOrderCounter++,
        targets: [],
      });
    }

    const planObj = plansMap.get(currentPlanTitle);
    planObj.targets.push({
      title: rawTargetTitle,
      weight,
      semesterScope,
      targetScoreSem1,
      targetScoreSem2,
      targetSemester,
      order: targetOrderCounter++,
    });
  }

  const plans = Array.from(plansMap.values());
  let totalWeight = 0;
  for (const p of plans) {
    for (const t of p.targets) {
      totalWeight += Number(t.weight) || 0;
    }
  }
  totalWeight = Math.round(totalWeight * 10) / 10;

  return {
    plans,
    totalWeight,
    totalTargets: targetOrderCounter - 1,
    errors,
  };
}

// ----------------------------------------------------------------------
// MONEV: INSTRUMEN 2 - PENILAIAN KOMPETENSI MENGAJAR MENTOR
// ----------------------------------------------------------------------

export function getTeachingCategory(percentage) {
  if (percentage == null || Number.isNaN(percentage)) {
    return { label: '—', tone: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  }
  const val = Number(percentage);
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

export const SEED_TEACHING_ASPECTS = [
  {
    title: 'Penguasaan Materi & Kurikulum',
    order: 1,
    indicators: [
      {
        title: 'Menguasai konsep dan materi bimbingan kepemimpinan secara mendalam dan sistematis',
        score: 4.0,
        order: 1,
      },
      {
        title: 'Mengaitkan materi pembelajaran dengan studi kasus atau dinamika riil awardee',
        score: 4.0,
        order: 2,
      },
    ],
  },
  {
    title: 'Metodologi & Keterampilan Mengajar',
    order: 2,
    indicators: [
      {
        title: 'Membuka sesi dengan apersepsi menarik, motivasi, dan kejelasan tujuan bimbingan',
        score: 4.0,
        order: 3,
      },
      {
        title: 'Menerapkan variasi metode interaktif (diskusi kelompok, tanya jawab, atau simulasi)',
        score: 4.0,
        order: 4,
      },
    ],
  },
  {
    title: 'Komunikasi & Interaksi dengan Awardee',
    order: 3,
    indicators: [
      {
        title: 'Menyampaikan materi dengan artikulasi jelas, bahasa persuasif, dan nada positif',
        score: 4.0,
        order: 5,
      },
      {
        title: 'Mendorong partisipasi aktif seluruh awardee secara inklusif tanpa dominasi sepihak',
        score: 4.0,
        order: 6,
      },
    ],
  },
  {
    title: 'Pengelolaan Kelas & Waktu (Time Management)',
    order: 4,
    indicators: [
      {
        title: 'Memulai dan menyelesaikan sesi pembinaan tepat waktu sesuai alokasi jadwal',
        score: 4.0,
        order: 7,
      },
      {
        title: 'Menjaga dinamika kelas tetap fokus, antusias, dan kondusif sepanjang durasi',
        score: 4.0,
        order: 8,
      },
    ],
  },
  {
    title: 'Evaluasi & Umpan Balik (Feedback)',
    order: 5,
    indicators: [
      {
        title: 'Memberikan tanggapan dan apresiasi konstruktif terhadap opini atau pertanyaan awardee',
        score: 4.0,
        order: 9,
      },
      {
        title: 'Melakukan reviu pemahaman dan merangkum poin-poin kunci di akhir sesi',
        score: 4.0,
        order: 10,
      },
    ],
  },
];

export function parseExcelTeachingPlans(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { aspects: [], totalIndicators: 0, totalMaxScore: 0, errors: ['File Excel kosong atau tidak memiliki baris data.'] };
  }

  const aspectsMap = new Map();
  let currentAspectTitle = '';
  const errors = [];
  let aspectOrderCounter = 1;
  let indicatorOrderCounter = 1;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;

    const findVal = (possibleKeys) => {
      for (const k of possibleKeys) {
        for (const [rk, rv] of Object.entries(r)) {
          if (rk.trim().toLowerCase() === k.toLowerCase()) {
            return rv;
          }
        }
      }
      return undefined;
    };

    const rawAspect = findVal(['aspek', 'nama aspek', 'aspek kompetensi', 'kategori aspek']);
    const rawIndicator = findVal(['indikator', 'nama indikator', 'butir indikator', 'pernyataan']);
    const rawScore = findVal(['skor', 'nilai skor', 'poin', 'bobot skor', 'skor maksimal']);

    if (rawAspect && typeof rawAspect === 'string' && rawAspect.trim()) {
      currentAspectTitle = rawAspect.trim();
    }

    if (!currentAspectTitle) {
      errors.push(`Baris ${rowNum}: Belum ada nama Aspek yang didefinisikan.`);
      continue;
    }

    const indicatorTitle = rawIndicator != null ? String(rawIndicator).trim() : '';
    if (!indicatorTitle) {
      continue;
    }

    let score = 4.0;
    if (rawScore != null && rawScore !== '') {
      const parsed = Number(rawScore);
      if (!Number.isNaN(parsed) && parsed > 0) {
        score = parsed;
      }
    }

    if (!aspectsMap.has(currentAspectTitle)) {
      aspectsMap.set(currentAspectTitle, {
        title: currentAspectTitle,
        order: aspectOrderCounter++,
        indicators: [],
      });
    }

    const aspectObj = aspectsMap.get(currentAspectTitle);
    aspectObj.indicators.push({
      title: indicatorTitle,
      score,
      order: indicatorOrderCounter++,
    });
  }

  const aspects = Array.from(aspectsMap.values());
  let totalMaxScore = 0;
  let totalIndicators = 0;

  for (const a of aspects) {
    for (const ind of a.indicators) {
      totalMaxScore += ind.score;
      totalIndicators++;
    }
  }

  return {
    aspects,
    totalIndicators,
    totalMaxScore: Math.round(totalMaxScore * 10) / 10,
    errors,
  };
}

// ==========================================
// INSTRUMEN 4: INDEPTH INTERVIEW AWARDEE
// ==========================================

export const SEED_INTERVIEW_ASPECTS = [
  {
    name: 'Academic Readiness',
    order: 1,
    description: 'Kesiapan dan performa akademik, adaptasi perkuliahan, dan manajemen waktu studi.',
    questions: [
      {
        question: 'Bagaimana perkembangan perkuliahan, adaptasi semester ini, dan pencapaian target IPK Anda?',
        guideNotes: 'Eksplorasi kendala mata kuliah, IPK berjalan vs target, dan relasi dengan dosen/rekan kampus.',
        order: 1,
      },
      {
        question: 'Kendala akademik apa yang paling menantang dan bagaimana Anda membagi waktu antara kuliah dan kegiatan pembinaan YES?',
        guideNotes: 'Fokus pada time management, prioritas tugas, dan mitigasi bentrok jadwal.',
        order: 2,
      },
    ],
  },
  {
    name: 'Islamic Character',
    order: 2,
    description: 'Konsistensi ibadah yaumiyah, adab pergaulan, dan pengamalan nilai integritas keislaman.',
    questions: [
      {
        question: 'Bagaimana konsistensi pelaksanaan ibadah harian (sholat 5 waktu berjamaah, rawatib, dhuha, qiyamullail, dan shaum sunnah)?',
        guideNotes: 'Tinjau mutabaah yaumiyah dan rutinitas ruhiyah pribadi awardee.',
        order: 1,
      },
      {
        question: 'Bagaimana penerapan adab islami, akhlak, dan integritas Anda dalam kehidupan bermasyarakat dan pergaulan di kampus?',
        guideNotes: 'Eksplorasi etika pergaulan, penjagaan pandangan/interaksi, serta kejujuran dalam studi.',
        order: 2,
      },
    ],
  },
  {
    name: 'Quranic Development',
    order: 3,
    description: 'Capaian tahsin, ziyadah tahfidz Al-Qur\'an, dan konsistensi muraja\'ah.',
    questions: [
      {
        question: 'Bagaimana capaian target tilawah harian serta progres hafalan (tahfidz) Al-Qur\'an selama semester ini?',
        guideNotes: 'Tanyakan jumlah juz/halaman yang berhasil dihafal serta keteraturan one day one juz.',
        order: 1,
      },
      {
        question: 'Metode apa yang Anda gunakan untuk menjaga kelancaran (mutqin) hafalan dan apa kendala yang dihadapi dalam muraja\'ah?',
        guideNotes: 'Cari tahu jadwal muraja\'ah mandiri atau tasmi\' bersama rekan/mentor.',
        order: 2,
      },
    ],
  },
  {
    name: 'Self Mastery',
    order: 4,
    description: 'Kematangan emosi, resiliensi mental, motivasi diri, dan pembentukan kebiasaan positif.',
    questions: [
      {
        question: 'Bagaimana cara Anda mengelola emosi, stres akademik/pribadi, dan menjaga motivasi belajar tetap tinggi?',
        guideNotes: 'Eksplorasi mekanisme koping saat menghadapi masalah atau tekanan beban tugas.',
        order: 1,
      },
      {
        question: 'Perubahan kebiasaan positif dan pengembangan karakter apa yang paling Anda rasakan sejak bergabung dalam pembinaan YES?',
        guideNotes: 'Tinjau kedisiplinan bangun pagi, kerapihan, kemandirian finansial sederhana, atau habits baru.',
        order: 2,
      },
    ],
  },
  {
    name: 'Social Impact Leadership',
    order: 5,
    description: 'Kepemimpinan diri dan publik, keaktifan organisasi kampus, serta kontribusi kerelawanan.',
    questions: [
      {
        question: 'Apa peran, keaktifan organisasi, atau kontribusi kerelawanan yang sedang Anda jalankan di kampus maupun masyarakat?',
        guideNotes: 'Catat nama organisasi, posisi/amanah, dan kontribusi nyata yang diberikan.',
        order: 1,
      },
      {
        question: 'Bagaimana rencana atau realisasi proyek sosial (social impact) Anda yang bermanfaat bagi lingkungan sekitar?',
        guideNotes: 'Eksplorasi kepekaan sosial awardee dalam menginisiasi solusi atas masalah di sekitarnya.',
        order: 2,
      },
    ],
  },
  {
    name: 'Mentor',
    order: 6,
    description: 'Evaluasi keterbukaan, kenyamanan hubungan, dan efektivitas bimbingan mentor pendamping.',
    questions: [
      {
        question: 'Bagaimana frekuensi komunikasi, kenyamanan berdiskusi, dan keterbukaan Anda bersama mentor wilayah?',
        guideNotes: 'Eksplorasi apakah awardee merasa nyaman curhat/konsultasi atau ada jarak komunikasi.',
        order: 1,
      },
      {
        question: 'Apa saran, masukan, atau harapan Anda terhadap bimbingan dan pendampingan yang diberikan oleh mentor?',
        guideNotes: 'Gali feedback konstruktif terkait materi pembinaan, metode mentoring, atau kepedulian mentor.',
        order: 2,
      },
    ],
  },
];

export function parseInterviewExcelRows(rows = []) {
  const aspectsMap = new Map();
  const errors = [];
  let aspectOrderCounter = 1;
  let questionOrderCounter = 1;
  let currentAspectName = '';

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;

    const findVal = (possibleKeys) => {
      for (const k of possibleKeys) {
        for (const [rk, rv] of Object.entries(r)) {
          if (rk.trim().toLowerCase() === k.toLowerCase()) {
            return rv;
          }
        }
      }
      return undefined;
    };

    const rawAspect = findVal(['aspek', 'nama aspek', 'kategori aspek', 'dimensi']);
    const rawQuestion = findVal(['pertanyaan', 'butir pertanyaan', 'teks pertanyaan', 'question']);
    const rawGuide = findVal(['panduan', 'catatan panduan', 'guide', 'keterangan']);

    if (rawAspect && typeof rawAspect === 'string' && rawAspect.trim()) {
      currentAspectName = rawAspect.trim();
    }

    if (!currentAspectName) {
      errors.push(`Baris ${rowNum}: Belum ada nama Aspek yang didefinisikan.`);
      continue;
    }

    const questionText = rawQuestion != null ? String(rawQuestion).trim() : '';
    if (!questionText) {
      continue;
    }

    const guideNotes = rawGuide != null && String(rawGuide).trim() ? String(rawGuide).trim() : null;

    if (!aspectsMap.has(currentAspectName)) {
      aspectsMap.set(currentAspectName, {
        name: currentAspectName,
        order: aspectOrderCounter++,
        questions: [],
      });
    }

    const aspectObj = aspectsMap.get(currentAspectName);
    aspectObj.questions.push({
      question: questionText,
      guideNotes,
      order: questionOrderCounter++,
    });
  }

  const aspects = Array.from(aspectsMap.values());
  let totalQuestions = 0;
  for (const a of aspects) {
    totalQuestions += a.questions.length;
  }

  return {
    aspects,
    totalQuestions,
    errors,
  };
}

// ----------------------------------------------------------------------
// INSTRUMEN 3: OBSERVASI WILAYAH - TEMPLATE BAWAAN & EXCEL PARSER
// ----------------------------------------------------------------------

export const DEFAULT_WILAYAH_OBSERVATION_ASPECTS = [
  // Bagian A: Perkembangan Program
  {
    order: 1,
    section: 'SECTION_A',
    title: 'Realisasi Pelaksanaan Program',
    description: 'Kesimpulan dan evaluasi pelaksanaan seluruh agenda program YES di wilayah mengacu pada keseluruhan instrumen monev.',
  },
  {
    order: 2,
    section: 'SECTION_A',
    title: 'Performa Mentor',
    description: 'Kesimpulan kualitas pendampingan, kepemimpinan, dan administrasi mentor wilayah mengacu pada Instrumen Penilaian Mentor dan Mengajar Mentor.',
  },
  {
    order: 3,
    section: 'SECTION_A',
    title: 'Kondisi & Perkembangan Awardee',
    description: 'Dinamika keaktifan, kedisiplinan pembinaan, komitmen, dan perkembangan capaian awardee di wilayah.',
  },

  // Bagian B: Temuan Ketidakcapaian Target Program
  {
    order: 4,
    section: 'SECTION_B',
    title: 'Target Capaian Akademik & Prestasi',
    description: 'Kategori temuan terkait capaian akademik atau prestasi awardee di kampus.',
  },
  {
    order: 5,
    section: 'SECTION_B',
    title: 'Kedisiplinan & Kehadiran Sesi Pembinaan',
    description: 'Kategori temuan terkait presensi sesi bimbingan dan keterlibatan aktif awardee/mentor.',
  },
  {
    order: 6,
    section: 'SECTION_B',
    title: 'Tata Kelola Wilayah & Kemitraan Kampus',
    description: 'Kategori temuan sarana prasarana, relasi kemitraan kampus, dan lingkungan pembinaan wilayah.',
  },
];

export function parseObservationExcelRows(rows = []) {
  const aspects = [];
  const errors = [];
  let aspectOrderCounter = 1;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;

    const findVal = (possibleKeys) => {
      for (const k of possibleKeys) {
        for (const [rk, rv] of Object.entries(r)) {
          if (rk.trim().toLowerCase() === k.toLowerCase()) {
            return rv;
          }
        }
      }
      return undefined;
    };

    const rawNo = findVal(['no', 'nomor', 'nomor urut', 'order']);
    const rawSection = findVal(['bagian', 'section', 'tipe bagian', 'kategori']);
    const rawAspect = findVal(['aspek', 'nama aspek', 'judul aspek']);
    const rawDesc = findVal(['deskripsi aspek', 'deskripsi', 'keterangan aspek', 'keterangan']);

    const aspectTitle = rawAspect != null ? String(rawAspect).trim() : '';
    if (!aspectTitle) {
      continue;
    }

    let section = 'SECTION_A';
    if (rawSection && typeof rawSection === 'string') {
      const s = rawSection.trim().toUpperCase();
      if (s.includes('B') || s.includes('TARGET') || s.includes('TEMUAN') || s.includes('KETIDAKCAPAIAN')) {
        section = 'SECTION_B';
      } else {
        section = 'SECTION_A';
      }
    }

    let order = aspectOrderCounter++;
    if (rawNo != null && !isNaN(Number(rawNo)) && Number(rawNo) > 0) {
      order = Number(rawNo);
    }

    aspects.push({
      order,
      section,
      title: aspectTitle,
      description: rawDesc != null && String(rawDesc).trim() ? String(rawDesc).trim() : null,
    });
  }

  return {
    aspects,
    totalAspects: aspects.length,
    errors,
  };
}


