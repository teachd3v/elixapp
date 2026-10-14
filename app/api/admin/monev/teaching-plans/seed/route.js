import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { SEED_TEACHING_ASPECTS } from '@/lib/monev';

// POST /api/admin/monev/teaching-plans/seed — Mengisi template standar instrumen kompetensi mengajar
export async function POST() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  try {
    const aspects = await prisma.$transaction(async (tx) => {
      // Hapus yang lama
      await tx.mentorTeachingAspect.deleteMany();

      const created = [];
      let indOrder = 1;

      for (const a of SEED_TEACHING_ASPECTS) {
        const aspect = await tx.mentorTeachingAspect.create({
          data: {
            title: a.title,
            order: a.order,
            indicators: {
              create: a.indicators.map((ind) => ({
                title: ind.title,
                score: ind.score,
                order: indOrder++,
              })),
            },
          },
          include: {
            indicators: {
              orderBy: { order: 'asc' },
            },
          },
        });
        created.push(aspect);
      }
      return created;
    });

    return NextResponse.json({
      success: true,
      message: 'Template standar instrumen kompetensi mengajar berhasil dimuat.',
      aspects,
    });
  } catch (err) {
    console.error('Error seeding teaching plans:', err);
    return NextResponse.json(
      { error: 'Gagal memuat template instrumen.', details: err.message },
      { status: 500 }
    );
  }
}
