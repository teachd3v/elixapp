import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { calculatePerformanceScores } from '@/lib/monev';

// GET /api/admin/monev/performance-evaluations — List evaluasi performa mentor
export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN' && me.role !== 'MENTOR') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const filterMentorId = url.searchParams.get('mentorId');

  let where = {};
  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id }, select: { id: true } });
    if (!mp) return NextResponse.json([]);
    where = { mentorId: mp.id };
  } else if (filterMentorId) {
    where = { mentorId: filterMentorId };
  }

  const evaluations = await prisma.mentorPerformanceEvaluation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
          wilayah: { select: { id: true, name: true } },
        },
      },
      evaluatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(evaluations);
}

// POST /api/admin/monev/performance-evaluations — Simpan evaluasi performa mentor
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    id: existingId,
    mentorId,
    periodName,
    evaluationYear = new Date().getFullYear(),
    itemScores = {},
    wellDoneNotes,
    improvementNotes,
    evaluatedById,
  } = body;

  if (!mentorId) {
    return NextResponse.json({ error: 'Mentor wajib dipilih.' }, { status: 400 });
  }
  if (!periodName?.trim()) {
    return NextResponse.json({ error: 'Periode penilaian wajib diisi (misal: Oktober - November).' }, { status: 400 });
  }

  // Ambil semua target kerja aktif untuk kalkulasi skor
  const allTargets = await prisma.mentorPerformanceTarget.findMany({
    orderBy: { order: 'asc' },
  });

  if (allTargets.length === 0) {
    return NextResponse.json(
      { error: 'Belum ada instrumen target kerja. Silakan atur atau muat template instrumen terlebih dahulu.' },
      { status: 400 }
    );
  }

  // Hitung nilai otomatis terbobot skala 100
  const calculation = calculatePerformanceScores(allTargets, itemScores);

  const evaluationData = {
    mentorId,
    periodName: periodName.trim(),
    evaluationYear: parseInt(evaluationYear, 10) || new Date().getFullYear(),
    scoreSemester1: calculation.scoreSemester1,
    scoreSemester2: calculation.scoreSemester2,
    totalScore: calculation.totalScore,
    category: calculation.category,
    wellDoneNotes: wellDoneNotes?.trim() || null,
    improvementNotes: improvementNotes?.trim() || null,
    itemScores,
    evaluatedById: evaluatedById || me.id,
  };

  let saved;
  if (existingId) {
    saved = await prisma.mentorPerformanceEvaluation.update({
      where: { id: existingId },
      data: evaluationData,
    });
  } else {
    saved = await prisma.mentorPerformanceEvaluation.create({
      data: evaluationData,
    });
  }

  return NextResponse.json(saved, { status: existingId ? 200 : 201 });
}
