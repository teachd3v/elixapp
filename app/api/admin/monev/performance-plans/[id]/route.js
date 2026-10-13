import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// PATCH /api/admin/monev/performance-plans/[id] — Update Rencana Kerja atau Target Kerja
export async function PATCH(request, context) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const {
    type = 'TARGET',
    title,
    weight,
    semesterScope,
    targetSemester,
    targetScoreSem1,
    targetScoreSem2,
    planId,
  } = body;

  if (type === 'PLAN') {
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Nama Rencana Kerja tidak boleh kosong.' }, { status: 400 });
    }
    const updated = await prisma.mentorPerformancePlan.update({
      where: { id },
      data: { title: title.trim() },
    });
    return NextResponse.json(updated);
  }

  // Update TARGET
  const data = {};
  if (title !== undefined) {
    if (!title?.trim()) return NextResponse.json({ error: 'Nama Target Kerja tidak boleh kosong.' }, { status: 400 });
    data.title = title.trim();
  }
  if (weight !== undefined) {
    const parsedWeight = parseFloat(weight);
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      return NextResponse.json({ error: 'Bobot harus berupa angka positif.' }, { status: 400 });
    }
    data.weight = parsedWeight;
  }
  if (semesterScope !== undefined) {
    const validScopes = ['SEMESTER_1', 'SEMESTER_2', 'KEDUANYA'];
    if (validScopes.includes(semesterScope)) data.semesterScope = semesterScope;
  }
  if (targetSemester !== undefined) {
    data.targetSemester = targetSemester?.trim() || null;
  }
  if (targetScoreSem1 !== undefined) {
    const num = targetScoreSem1 === null || targetScoreSem1 === '' ? null : parseFloat(targetScoreSem1);
    data.targetScoreSem1 = num === null || Number.isNaN(num) ? null : Math.min(4.0, Math.max(0.0, num));
  }
  if (targetScoreSem2 !== undefined) {
    const num = targetScoreSem2 === null || targetScoreSem2 === '' ? null : parseFloat(targetScoreSem2);
    data.targetScoreSem2 = num === null || Number.isNaN(num) ? null : Math.min(4.0, Math.max(0.0, num));
  }
  if (planId !== undefined) {
    data.planId = planId;
  }

  const updatedTarget = await prisma.mentorPerformanceTarget.update({
    where: { id },
    data,
  });

  return NextResponse.json(updatedTarget);
}

// DELETE /api/admin/monev/performance-plans/[id]?type=PLAN|TARGET
export async function DELETE(request, context) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await context.params;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'TARGET';

  if (type === 'PLAN') {
    await prisma.mentorPerformancePlan.delete({ where: { id } });
  } else {
    await prisma.mentorPerformanceTarget.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
