import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { DEFAULT_PERFORMANCE_PLANS } from '@/lib/monev';

// POST /api/admin/monev/performance-plans/seed — Muat template rencana & target kerja standar
export async function POST() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  // Transaksi penghapusan template lama jika ingin me-reset / memuat ulang
  await prisma.$transaction(async (tx) => {
    // Hapus target dan plan lama
    await tx.mentorPerformanceTarget.deleteMany({});
    await tx.mentorPerformancePlan.deleteMany({});

    // Buat data default
    for (const planData of DEFAULT_PERFORMANCE_PLANS) {
      const createdPlan = await tx.mentorPerformancePlan.create({
        data: {
          title: planData.title,
          order: planData.order,
        },
      });

      for (const targetData of planData.targets) {
        await tx.mentorPerformanceTarget.create({
          data: {
            planId: createdPlan.id,
            title: targetData.title,
            weight: targetData.weight,
            semesterScope: targetData.semesterScope,
            targetScoreSem1: targetData.targetScoreSem1 ?? null,
            targetScoreSem2: targetData.targetScoreSem2 ?? null,
            targetSemester: targetData.targetSemester,
            order: targetData.order,
          },
        });
      }
    }
  });

  const allPlans = await prisma.mentorPerformancePlan.findMany({
    orderBy: { order: 'asc' },
    include: { targets: { orderBy: { order: 'asc' } } },
  });

  return NextResponse.json({ ok: true, plans: allPlans });
}
