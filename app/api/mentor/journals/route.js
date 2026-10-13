import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

export const JOURNAL_ACTIVITIES = [
  'Ekselensia Leadership Camp',
  'Seleksi YES',
  'Pembinaan Individu',
  'Pembinaan Klasikal',
  'Outing Class',
  'YES Day Out',
  'Weekly Meeting',
  'Young Leadership Festival',
  'Temu Tokoh',
  'Book Sharing',
  'Merapihkan Administrasi',
  'Laporan Keuangan',
  'Publikasi Instagram',
  'Talent Hub Class',
  'Kegiatan Mitra',
  'Upgrading Mentor',
];

const MAX_PHOTO_BYTES = 800 * 1024; // 800 KB max after client compression

function b64Size(s) {
  if (typeof s !== 'string' || !s.startsWith('data:')) return -1;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}

function generateJournalCode(dateObj) {
  const d = dateObj instanceof Date && !Number.isNaN(dateObj.getTime()) ? dateObj : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JRN-${yyyy}${mm}${dd}-${rand}`;
}

// GET /api/mentor/journals — ambil daftar jurnal milik mentor (atau semua jika SUPERADMIN)
export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let where = {};
  if (me.role === 'MENTOR') {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: me.id },
      select: { id: true, wilayah: { select: { id: true, name: true } } },
    });
    if (!mentor) {
      return NextResponse.json({ journals: [], wilayah: null });
    }
    where = { mentorId: mentor.id };

    const journals = await prisma.mentorJournal.findMany({
      where,
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      journals,
      wilayah: mentor.wilayah,
      mentorId: mentor.id,
    });
  }

  // Jika SUPERADMIN ingin memantau jurnal (opsional filter ?mentorId=...)
  const url = new URL(request.url);
  const filterMentorId = url.searchParams.get('mentorId');
  if (filterMentorId) where.mentorId = filterMentorId;

  const journals = await prisma.mentorJournal.findMany({
    where,
    orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    include: {
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          wilayah: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ journals });
}

// POST /api/mentor/journals — buat entri jurnal baru (MENTOR only)
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR') return new NextResponse('Forbidden', { status: 403 });

  const mentor = await prisma.mentorProfile.findUnique({
    where: { userId: me.id },
    select: { id: true },
  });
  if (!mentor) {
    return NextResponse.json(
      { error: 'Profil mentor belum lengkap. Silakan lengkapi profil terlebih dahulu.' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const {
    journalCode,
    activityName,
    qualitativeAchievement,
    quantitativeAchievement,
    activityDate,
    activityTime,
    locationType,
    locationDetail,
    problemIdentification,
    improvementPlan,
    evidenceText,
    evidencePhoto,
  } = body;

  if (!activityName || !JOURNAL_ACTIVITIES.includes(activityName)) {
    return NextResponse.json({ error: 'Pilih Nama Kegiatan yang valid dari daftar.' }, { status: 400 });
  }
  if (!qualitativeAchievement?.trim()) {
    return NextResponse.json({ error: 'Capaian Kualitatif wajib diisi.' }, { status: 400 });
  }
  if (!quantitativeAchievement?.trim()) {
    return NextResponse.json({ error: 'Capaian Kuantitatif wajib diisi.' }, { status: 400 });
  }

  const parsedDate = new Date(activityDate);
  if (!activityDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Tanggal Pelaksanaan tidak valid.' }, { status: 400 });
  }

  if (!activityTime?.trim()) {
    return NextResponse.json({ error: 'Waktu Pelaksanaan (format 24 jam) wajib diisi.' }, { status: 400 });
  }

  if (!['Daring', 'Luring'].includes(locationType)) {
    return NextResponse.json({ error: 'Pilih Tempat Pelaksanaan (Daring atau Luring).' }, { status: 400 });
  }
  if (!locationDetail?.trim()) {
    return NextResponse.json({ error: 'Deskripsi Tempat Pelaksanaan wajib diisi.' }, { status: 400 });
  }

  if (!problemIdentification?.trim()) {
    return NextResponse.json({ error: 'Identifikasi Masalah wajib diisi.' }, { status: 400 });
  }
  if (!improvementPlan?.trim()) {
    return NextResponse.json({ error: 'Rencana Perbaikan wajib diisi.' }, { status: 400 });
  }

  if (!evidenceText?.trim() && !evidencePhoto) {
    return NextResponse.json(
      { error: 'Evidence wajib diisi (berupa teks keterangan/link atau unggah foto dokumentasi).' },
      { status: 400 }
    );
  }

  if (evidencePhoto) {
    const size = b64Size(evidencePhoto);
    if (size < 0) {
      return NextResponse.json({ error: 'Format foto dokumentasi tidak valid.' }, { status: 400 });
    }
    if (size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Ukuran foto dokumentasi terlalu besar (>800 KB).' }, { status: 400 });
    }
  }

  // Pastikan journalCode unik
  let finalCode = journalCode?.trim() || generateJournalCode(parsedDate);
  const existingCode = await prisma.mentorJournal.findUnique({
    where: { journalCode: finalCode },
    select: { id: true },
  });
  if (existingCode) {
    finalCode = generateJournalCode(parsedDate);
  }

  const created = await prisma.mentorJournal.create({
    data: {
      journalCode: finalCode,
      mentorId: mentor.id,
      activityName,
      qualitativeAchievement: qualitativeAchievement.trim(),
      quantitativeAchievement: quantitativeAchievement.trim(),
      activityDate: parsedDate,
      activityTime: activityTime.trim(),
      locationType,
      locationDetail: locationDetail.trim(),
      problemIdentification: problemIdentification.trim(),
      improvementPlan: improvementPlan.trim(),
      evidenceText: evidenceText?.trim() || null,
      evidencePhoto: evidencePhoto || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
