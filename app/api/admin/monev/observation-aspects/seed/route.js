import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { DEFAULT_WILAYAH_OBSERVATION_ASPECTS } from '@/lib/monev';

// POST /api/admin/monev/observation-aspects/seed — Mengisi template standar aspek observasi wilayah
export async function POST() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  try {
    const aspects = await prisma.$transaction(async (tx) => {
      // Hapus data aspek yang lama
      await tx.wilayahObservationAspect.deleteMany();

      const created = [];
      for (const a of DEFAULT_WILAYAH_OBSERVATION_ASPECTS) {
        const aspect = await tx.wilayahObservationAspect.create({
          data: {
            section: a.section,
            title: a.title,
            description: a.description || null,
            order: a.order,
          },
        });
        created.push(aspect);
      }
      return created;
    });

    return NextResponse.json({
      success: true,
      message: 'Template standar 6 aspek observasi wilayah berhasil dimuat.',
      aspects,
    });
  } catch (err) {
    console.error('Error seeding observation aspects:', err);
    return NextResponse.json(
      { error: 'Gagal memuat template observasi wilayah.', details: err.message },
      { status: 500 }
    );
  }
}
