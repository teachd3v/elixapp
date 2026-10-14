import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// POST /api/admin/monev/teaching-plans/bulk-import
// Payload: { mode: 'REPLACE' | 'APPEND', aspects: [ { title, indicators: [ { title, score } ] } ] }
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { mode = 'REPLACE', aspects = [] } = body;

  if (!Array.isArray(aspects) || aspects.length === 0) {
    return NextResponse.json(
      { error: 'Data aspek kompetensi mengajar tidak valid atau kosong.' },
      { status: 400 }
    );
  }

  // Validasi isi aspects & indicators
  let totalIndicators = 0;
  for (const a of aspects) {
    if (!a.title?.trim()) {
      return NextResponse.json(
        { error: 'Setiap aspek wajib memiliki nama (title).' },
        { status: 400 }
      );
    }
    if (!Array.isArray(a.indicators) || a.indicators.length === 0) {
      return NextResponse.json(
        { error: `Aspek "${a.title}" tidak memiliki butir indikator.` },
        { status: 400 }
      );
    }
    for (const ind of a.indicators) {
      if (!ind.title?.trim()) {
        return NextResponse.json(
          { error: `Indikator pada aspek "${a.title}" wajib memiliki teks pernyataan.` },
          { status: 400 }
        );
      }
      const s = Number(ind.score);
      if (Number.isNaN(s) || s <= 0) {
        return NextResponse.json(
          { error: `Skor untuk indikator "${ind.title}" harus berupa angka positif.` },
          { status: 400 }
        );
      }
      totalIndicators++;
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let startingAspectOrder = 1;
      let startingIndicatorOrder = 1;

      if (mode === 'REPLACE') {
        // Hapus semua aspek lama (otomatis cascade ke indikator)
        await tx.mentorTeachingAspect.deleteMany();
      } else {
        // Mode APPEND: hitung order tertinggi
        const maxAspect = await tx.mentorTeachingAspect.findFirst({
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        if (maxAspect) startingAspectOrder = maxAspect.order + 1;

        const maxInd = await tx.mentorTeachingIndicator.findFirst({
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        if (maxInd) startingIndicatorOrder = maxInd.order + 1;
      }

      const createdAspects = [];
      let currentAspectOrder = startingAspectOrder;
      let currentIndOrder = startingIndicatorOrder;

      for (const a of aspects) {
        const aspect = await tx.mentorTeachingAspect.create({
          data: {
            title: a.title.trim(),
            order: currentAspectOrder++,
            indicators: {
              create: a.indicators.map((ind) => ({
                title: ind.title.trim(),
                score: Number(ind.score) || 4.0,
                order: currentIndOrder++,
              })),
            },
          },
          include: {
            indicators: {
              orderBy: { order: 'asc' },
            },
          },
        });
        createdAspects.push(aspect);
      }

      return createdAspects;
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${result.length} aspek dan ${totalIndicators} butir indikator.`,
      aspects: result,
    });
  } catch (err) {
    console.error('Error in bulk import teaching plans:', err);
    return NextResponse.json(
      { error: 'Gagal melakukan bulk import instrumen kompetensi mengajar.', details: err.message },
      { status: 500 }
    );
  }
}
