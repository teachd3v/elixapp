import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// POST /api/admin/monev/interview-questions/bulk-import
// Payload: { mode: 'REPLACE' | 'APPEND', aspects: [ { name, questions: [ { question, guideNotes } ] } ] }
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { mode = 'REPLACE', aspects = [] } = body;

  if (!Array.isArray(aspects) || aspects.length === 0) {
    return NextResponse.json(
      { error: 'Data aspek wawancara tidak valid atau kosong.' },
      { status: 400 }
    );
  }

  // Validasi isi aspects & questions
  let totalQuestions = 0;
  for (const a of aspects) {
    if (!a.name?.trim()) {
      return NextResponse.json(
        { error: 'Setiap aspek wajib memiliki nama.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(a.questions) || a.questions.length === 0) {
      return NextResponse.json(
        { error: `Aspek "${a.name}" tidak memiliki butir pertanyaan.` },
        { status: 400 }
      );
    }
    for (const q of a.questions) {
      if (!q.question?.trim()) {
        return NextResponse.json(
          { error: `Pertanyaan pada aspek "${a.name}" wajib memiliki teks.` },
          { status: 400 }
        );
      }
      totalQuestions++;
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let startingAspectOrder = 1;
      let startingQuestionOrder = 1;

      if (mode === 'REPLACE') {
        await tx.awardeeInterviewAspect.deleteMany();
      } else {
        const lastAspect = await tx.awardeeInterviewAspect.findFirst({
          orderBy: { order: 'desc' },
        });
        if (lastAspect) {
          startingAspectOrder = lastAspect.order + 1;
        }
        const lastQuestion = await tx.awardeeInterviewQuestion.findFirst({
          orderBy: { order: 'desc' },
        });
        if (lastQuestion) {
          startingQuestionOrder = lastQuestion.order + 1;
        }
      }

      const createdAspects = [];
      for (const a of aspects) {
        const aspectRecord = await tx.awardeeInterviewAspect.create({
          data: {
            name: a.name.trim(),
            description: a.description?.trim() || null,
            order: startingAspectOrder++,
            questions: {
              create: a.questions.map((q) => ({
                question: q.question.trim(),
                guideNotes: q.guideNotes?.trim() || null,
                order: startingQuestionOrder++,
              })),
            },
          },
          include: {
            questions: {
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
      message: `Bulk import berhasil. ${result.length} aspek dan ${totalQuestions} pertanyaan telah disimpan.`,
      aspects: result,
    });
  } catch (error) {
    console.error('Error bulk importing interview questions:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan bulk import pertanyaan wawancara.', details: error.message },
      { status: 500 }
    );
  }
}
