import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { SEED_INTERVIEW_ASPECTS } from '@/lib/monev';

// POST /api/admin/monev/interview-questions/seed — Mengisi template standar 6 aspek pertanyaan wawancara awardee
export async function POST() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  try {
    const aspects = await prisma.$transaction(async (tx) => {
      // Hapus data yang lama
      await tx.awardeeInterviewAspect.deleteMany();

      const created = [];
      let qOrder = 1;

      for (const a of SEED_INTERVIEW_ASPECTS) {
        const aspect = await tx.awardeeInterviewAspect.create({
          data: {
            name: a.name,
            description: a.description,
            order: a.order,
            questions: {
              create: a.questions.map((q) => ({
                question: q.question,
                guideNotes: q.guideNotes || null,
                order: qOrder++,
              })),
            },
          },
          include: {
            questions: {
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
      message: 'Template standar 6 aspek pertanyaan wawancara awardee berhasil dimuat.',
      aspects,
    });
  } catch (err) {
    console.error('Error seeding interview questions:', err);
    return NextResponse.json(
      { error: 'Gagal memuat template pertanyaan wawancara.', details: err.message },
      { status: 500 }
    );
  }
}
