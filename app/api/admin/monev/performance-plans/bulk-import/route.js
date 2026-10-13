import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// POST /api/admin/monev/performance-plans/bulk-import
// Payload: { mode: 'REPLACE' | 'APPEND', plans: [ { title, targets: [ { title, weight, semesterScope, targetSemester } ] } ] }
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { mode = 'REPLACE', plans = [] } = body;

  if (!Array.isArray(plans) || plans.length === 0) {
    return NextResponse.json(
      { error: 'Data rencana kerja tidak valid atau kosong.' },
      { status: 400 }
    );
  }

  // Validasi isi plans & targets
  let totalTargets = 0;
  let totalWeight = 0;

  for (const p of plans) {
    if (!p.title?.trim()) {
      return NextResponse.json(
        { error: 'Setiap rencana kerja wajib memiliki nama (title).' },
        { status: 400 }
      );
    }
    if (!Array.isArray(p.targets) || p.targets.length === 0) {
      return NextResponse.json(
        { error: `Rencana kerja "${p.title}" tidak memiliki target kerja.` },
        { status: 400 }
      );
    }
    for (const t of p.targets) {
      if (!t.title?.trim()) {
        return NextResponse.json(
          { error: `Target kerja pada rencana "${p.title}" wajib memiliki nama.` },
          { status: 400 }
        );
      }
      const w = Number(t.weight);
      if (Number.isNaN(w) || w <= 0) {
        return NextResponse.json(
          { error: `Bobot untuk target "${t.title}" harus berupa angka positif.` },
          { status: 400 }
        );
      }
      totalTargets++;
      totalWeight += w;
    }
  }

  totalWeight = Math.round(totalWeight * 10) / 10;

  try {
    await prisma.$transaction(async (tx) => {
      let planOrderOffset = 0;
      let targetOrderOffset = 0;

      if (mode === 'REPLACE') {
        // Hapus target dan rencana lama
        await tx.mentorPerformanceTarget.deleteMany({});
        await tx.mentorPerformancePlan.deleteMany({});
      } else {
        // Jika APPEND, cari order tertinggi yang sudah ada
        const existingPlansCount = await tx.mentorPerformancePlan.count();
        planOrderOffset = existingPlansCount;
        const existingTargetsCount = await tx.mentorPerformanceTarget.count();
        targetOrderOffset = existingTargetsCount;
      }

      // Masukkan plans dan targets baru
      for (let pIdx = 0; pIdx < plans.length; pIdx++) {
        const p = plans[pIdx];
        const createdPlan = await tx.mentorPerformancePlan.create({
          data: {
            title: p.title.trim(),
            order: planOrderOffset + pIdx + 1,
          },
        });

        for (let tIdx = 0; tIdx < p.targets.length; tIdx++) {
          const t = p.targets[tIdx];
          const rawScope = t.semesterScope || 'KEDUANYA';
          const validScope =
            rawScope === 'SEMESTER_1' || rawScope === 'SEMESTER_2' ? rawScope : 'KEDUANYA';

          await tx.mentorPerformanceTarget.create({
            data: {
              planId: createdPlan.id,
              title: t.title.trim(),
              weight: Number(t.weight) || 0,
              semesterScope: validScope,
              targetSemester: t.targetSemester?.trim() || '-',
              order: targetOrderOffset + tIdx + 1,
            },
          });
        }
      }
    });

    // Ambil data terbaru
    const updatedPlans = await prisma.mentorPerformancePlan.findMany({
      orderBy: { order: 'asc' },
      include: {
        targets: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${plans.length} Rencana Kerja dan ${totalTargets} Target Kerja.`,
      countPlans: plans.length,
      countTargets: totalTargets,
      totalWeight,
      plans: updatedPlans,
    });
  } catch (err) {
    console.error('Error during bulk import of performance plans:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan hasil bulk import ke database.' },
      { status: 500 }
    );
  }
}
