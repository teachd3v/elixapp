import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/teaching-evaluations/[id]
export async function GET(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  const evaluation = await prisma.mentorTeachingEvaluation.findUnique({
    where: { id },
    include: {
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          wilayah: { select: { id: true, name: true } },
        },
      },
      evaluatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluasi tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json(evaluation);
}

// PUT /api/admin/monev/teaching-evaluations/[id]
export async function PUT(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
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

  try {
    const updated = await prisma.mentorTeachingEvaluation.update({
      where: { id },
      data: {
        periodName: periodName?.trim() || undefined,
        evaluationDate: evaluationDate ? new Date(evaluationDate) : undefined,
        sessionTopic: sessionTopic !== undefined ? (sessionTopic?.trim() || null) : undefined,
        totalScore: totalScore != null ? Number(totalScore) : undefined,
        maxScore: maxScore != null ? Number(maxScore) : undefined,
        percentage: percentage != null ? Number(percentage) : undefined,
        category: category || undefined,
        strengthsNotes: strengthsNotes !== undefined ? (strengthsNotes?.trim() || null) : undefined,
        improvementNotes: improvementNotes !== undefined ? (improvementNotes?.trim() || null) : undefined,
        itemScores: itemScores || undefined,
        evaluatedById: evaluatedById || undefined,
      },
      include: {
        evaluatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating teaching evaluation:', err);
    return NextResponse.json(
      { error: 'Gagal memperbarui evaluasi kompetensi mengajar.', details: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/monev/teaching-evaluations/[id]
export async function DELETE(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;

  try {
    await prisma.mentorTeachingEvaluation.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Evaluasi kompetensi mengajar berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting teaching evaluation:', err);
    return NextResponse.json(
      { error: 'Gagal menghapus evaluasi.', details: err.message },
      { status: 500 }
    );
  }
}
