import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/teaching-evaluations — Ambil daftar evaluasi kompetensi mengajar
export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const mentorId = url.searchParams.get('mentorId');

  const where = {};
  if (mentorId) where.mentorId = mentorId;

  const evaluations = await prisma.mentorTeachingEvaluation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          wilayah: { select: { id: true, name: true } },
        },
      },
      evaluatedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(evaluations);
}

// POST /api/admin/monev/teaching-evaluations — Simpan evaluasi kompetensi mengajar baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    mentorId,
    periodName,
    evaluationDate,
    sessionTopic,
    totalScore,
    maxScore,
    percentage,
    category,
    strengthsNotes,
    improvementNotes,
    itemScores,
    evaluatedById,
  } = body;

  if (!mentorId) {
    return NextResponse.json({ error: 'Mentor wajib dipilih.' }, { status: 400 });
  }
  if (!periodName?.trim()) {
    return NextResponse.json({ error: 'Nama Periode Penilaian wajib diisi.' }, { status: 400 });
  }
  if (!itemScores || typeof itemScores !== 'object') {
    return NextResponse.json({ error: 'Rincian skor indikator tidak valid.' }, { status: 400 });
  }

  try {
    const evaluation = await prisma.mentorTeachingEvaluation.create({
      data: {
        mentorId,
        periodName: periodName.trim(),
        evaluationDate: evaluationDate ? new Date(evaluationDate) : new Date(),
        sessionTopic: sessionTopic?.trim() || null,
        totalScore: Number(totalScore) || 0,
        maxScore: Number(maxScore) || 0,
        percentage: Number(percentage) || 0,
        category: category || 'CUKUP',
        strengthsNotes: strengthsNotes?.trim() || null,
        improvementNotes: improvementNotes?.trim() || null,
        itemScores,
        evaluatedById: evaluatedById || me.id,
      },
      include: {
        evaluatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (err) {
    console.error('Error creating teaching evaluation:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan evaluasi kompetensi mengajar.', details: err.message },
      { status: 500 }
    );
  }
}
