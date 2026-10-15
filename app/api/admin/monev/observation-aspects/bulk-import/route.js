import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// POST /api/admin/monev/observation-aspects/bulk-import
// Payload: { mode: 'REPLACE' | 'APPEND', aspects: [ { section, title, description, indicators: [ { title, guideNotes } ] } ] }
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { mode = 'REPLACE', aspects = [] } = body;

  if (!Array.isArray(aspects) || aspects.length === 0) {
    return NextResponse.json(
      { error: 'Data aspek observasi tidak valid atau kosong.' },
      { status: 400 }
    );
  }

  // Validasi isi aspects & indicators
  let totalIndicators = 0;
  for (const a of aspects) {
    if (!a.title?.trim()) {
      return NextResponse.json(
        { error: 'Setiap aspek wajib memiliki judul.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(a.indicators) || a.indicators.length === 0) {
      return NextResponse.json(
        { error: `Aspek "${a.title}" tidak memiliki butir indikator / panduan.` },
        { status: 400 }
      );
    }
    for (const ind of a.indicators) {
      if (!ind.title?.trim()) {
        return NextResponse.json(
          { error: `Indikator pada aspek "${a.title}" wajib memiliki judul.` },
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
        await tx.wilayahObservationAspect.deleteMany();
      } else {
        const lastAspect = await tx.wilayahObservationAspect.findFirst({
          orderBy: { order: 'desc' },
        });
        if (lastAspect) {
          startingAspectOrder = lastAspect.order + 1;
        }
        const lastIndicator = await tx.wilayahObservationIndicator.findFirst({
          orderBy: { order: 'desc' },
        });
        if (lastIndicator) {
          startingIndicatorOrder = lastIndicator.order + 1;
        }
      }

      const createdAspects = [];
      for (const a of aspects) {
        const sec = a.section === 'SECTION_B' ? 'SECTION_B' : 'SECTION_A';
        const aspectRecord = await tx.wilayahObservationAspect.create({
          data: {
            section: sec,
            title: a.title.trim(),
            description: a.description?.trim() || null,
            order: startingAspectOrder++,
            indicators: {
              create: a.indicators.map((ind) => ({
                title: ind.title.trim(),
                guideNotes: ind.guideNotes?.trim() || null,
                order: startingIndicatorOrder++,
              })),
            },
          },
          include: {
            indicators: {
              orderBy: { order: 'asc' },
            },
          },
        });
        createdAspects.push(aspectRecord);
      }

      return createdAspects;
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${result.length} aspek dan ${totalIndicators} butir panduan observasi wilayah.`,
      countAspects: result.length,
      countIndicators: totalIndicators,
      aspects: result,
    });
  } catch (error) {
    console.error('Error bulk importing observation aspects:', error);
    return NextResponse.json(
      { error: 'Gagal mengimpor data instrumen observasi wilayah.', details: error.message },
      { status: 500 }
    );
  }
}
