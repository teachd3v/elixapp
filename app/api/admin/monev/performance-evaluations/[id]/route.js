import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/performance-evaluations/[id]
export async function GET(_request, context) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await context.params;
  const evaluation = await prisma.mentorPerformanceEvaluation.findUnique({
    where: { id },
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

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluasi tidak ditemukan' }, { status: 404 });
  }

  // Mentor hanya boleh melihat milik mereka sendiri
  if (me.role === 'MENTOR' && evaluation.mentor?.userId !== me.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.json(evaluation);
}

// DELETE /api/admin/monev/performance-evaluations/[id]
export async function DELETE(_request, context) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await context.params;
  await prisma.mentorPerformanceEvaluation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
