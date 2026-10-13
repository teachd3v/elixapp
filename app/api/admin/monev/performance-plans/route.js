import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/performance-plans — Ambil master data Rencana Kerja & Target Kerja
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const plans = await prisma.mentorPerformancePlan.findMany({
    orderBy: { order: 'asc' },
    include: {
      targets: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return NextResponse.json(plans);
}

// POST /api/admin/monev/performance-plans — Tambah Rencana Kerja baru ATAU Target Kerja baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { type, planTitle, planId, targetTitle, weight, semesterScope, targetSemester } = body;

  if (type === 'PLAN') {
    if (!planTitle?.trim()) {
      return NextResponse.json({ error: 'Nama Rencana Kerja wajib diisi.' }, { status: 400 });
    }
    const count = await prisma.mentorPerformancePlan.count();
    const createdPlan = await prisma.mentorPerformancePlan.create({
      data: {
        title: planTitle.trim(),
        order: count + 1,
      },
      include: { targets: true },
    });
    return NextResponse.json(createdPlan, { status: 201 });
  }

  // Tambah TARGET KERJA
  if (!planId) {
    return NextResponse.json({ error: 'Rencana Kerja induk wajib dipilih.' }, { status: 400 });
  }
  if (!targetTitle?.trim()) {
    return NextResponse.json({ error: 'Nama Target Kerja wajib diisi.' }, { status: 400 });
  }
  const parsedWeight = parseFloat(weight);
  if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
    return NextResponse.json({ error: 'Bobot harus berupa angka positif.' }, { status: 400 });
  }

  const validScopes = ['SEMESTER_1', 'SEMESTER_2', 'KEDUANYA'];
  const scope = validScopes.includes(semesterScope) ? semesterScope : 'KEDUANYA';

  const targetCount = await prisma.mentorPerformanceTarget.count({ where: { planId } });
  const createdTarget = await prisma.mentorPerformanceTarget.create({
    data: {
      planId,
      title: targetTitle.trim(),
      weight: parsedWeight,
      semesterScope: scope,
      targetSemester: targetSemester?.trim() || 'Target capaian standar',
      order: targetCount + 1,
    },
  });

  return NextResponse.json(createdTarget, { status: 201 });
}
