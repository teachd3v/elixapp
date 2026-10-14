import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/teaching-plans — Ambil master data Aspek & Indikator Kompetensi Mengajar
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const aspects = await prisma.mentorTeachingAspect.findMany({
    orderBy: { order: 'asc' },
    include: {
      indicators: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return NextResponse.json(aspects);
}

// POST /api/admin/monev/teaching-plans — Tambah Aspek baru ATAU Indikator baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    type, // 'ASPECT' | 'INDICATOR'
    aspectTitle,
    aspectId,
    indicatorTitle,
    score,
  } = body;

  if (type === 'ASPECT') {
    if (!aspectTitle?.trim()) {
      return NextResponse.json({ error: 'Nama Aspek wajib diisi.' }, { status: 400 });
    }
    const count = await prisma.mentorTeachingAspect.count();
    const createdAspect = await prisma.mentorTeachingAspect.create({
      data: {
        title: aspectTitle.trim(),
        order: count + 1,
      },
      include: { indicators: true },
    });
    return NextResponse.json(createdAspect, { status: 201 });
  }

  // Tambah INDIKATOR
  if (!aspectId) {
    return NextResponse.json({ error: 'Aspek induk wajib dipilih.' }, { status: 400 });
  }
  if (!indicatorTitle?.trim()) {
    return NextResponse.json({ error: 'Butir Indikator wajib diisi.' }, { status: 400 });
  }

  const numScore = Number(score);
  if (Number.isNaN(numScore) || numScore <= 0) {
    return NextResponse.json({ error: 'Nilai skor harus berupa angka positif.' }, { status: 400 });
  }

  const count = await prisma.mentorTeachingIndicator.count({ where: { aspectId } });
  const createdIndicator = await prisma.mentorTeachingIndicator.create({
    data: {
      aspectId,
      title: indicatorTitle.trim(),
      score: numScore,
      order: count + 1,
    },
  });

  return NextResponse.json(createdIndicator, { status: 201 });
}
