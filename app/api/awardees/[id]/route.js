import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { blendedScore, toElixIndex, elixCategory } from '@/lib/assessment';

export async function GET(request, { params }) {
  try {
    const me = await getCurrentDbUser();
    if (!me) return new NextResponse('Unauthorized', { status: 401 });
    
    // Hanya Superadmin dan Mentor yang bisa mengakses detail awardee
    if (me.role !== 'SUPERADMIN' && me.role !== 'MENTOR') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    const awardee = await prisma.awardeeProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true, phone: true } },
        wilayah: true,
        portfolios: { orderBy: { date: 'desc' } },
        attendances: { 
          include: { session: true },
          orderBy: { session: { date: 'desc' } }
        },
        assessmentRecords: {
          include: { period: true },
          orderBy: { period: { startDate: 'asc' } }
        }
      }
    });

    if (!awardee) return new NextResponse('Not Found', { status: 404 });

    // Jika Mentor, pastikan awardee ini berada di wilayahnya
    if (me.role === 'MENTOR') {
      const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
      if (mp?.wilayahId !== awardee.wilayahId) {
        return new NextResponse('Forbidden: Not your region', { status: 403 });
      }
    }

    // Ambil seluruh master periode penilaian
    const allPeriods = await prisma.assessmentPeriod.findMany({
      orderBy: { startDate: 'asc' }
    });

    // Hitung elix siklus aktif saat ini
    const hasSA = !!awardee.hasFilledSA;
    const hasMA = !!awardee.hasFilledMA;
    const raw = blendedScore(awardee.saScore || 0, awardee.maScore || 0, hasSA, hasMA);
    const elix = (hasSA || hasMA) ? toElixIndex(raw) : null;

    // Siapkan cycles (gabungan live period dan record historis secara kronologis)
    const cycles = allPeriods.map(p => {
      if (p.isActive) {
        return {
          id: `active-${p.id}`,
          periodId: p.id,
          period: p,
          isLive: true,
          hasFilledSA: hasSA,
          saScore: awardee.saScore || 0,
          saResponses: awardee.saResponses,
          saDimensionScores: awardee.saDimensionScores,
          saSubmittedAt: awardee.saSubmittedAt,
          hasFilledMA: hasMA,
          maScore: awardee.maScore || 0,
          maResponses: awardee.maResponses,
          maDimensionScores: awardee.maDimensionScores,
          maSubmittedAt: awardee.maSubmittedAt,
          maById: awardee.maById,
          elix,
          category: elix ? elixCategory(elix) : null,
        };
      } else {
        const rec = awardee.assessmentRecords.find(r => r.periodId === p.id);
        const rSA = !!rec?.hasFilledSA;
        const rMA = !!rec?.hasFilledMA;
        const rRaw = blendedScore(rec?.saScore || 0, rec?.maScore || 0, rSA, rMA);
        const rElix = (rSA || rMA) ? toElixIndex(rRaw) : null;
        return {
          id: rec?.id || `hist-${p.id}`,
          periodId: p.id,
          period: p,
          isLive: false,
          hasFilledSA: rSA,
          saScore: rec?.saScore || 0,
          saResponses: rec?.saResponses,
          saDimensionScores: rec?.saDimensionScores,
          saSubmittedAt: rec?.saSubmittedAt,
          hasFilledMA: rMA,
          maScore: rec?.maScore || 0,
          maResponses: rec?.maResponses,
          maDimensionScores: rec?.maDimensionScores,
          maSubmittedAt: rec?.maSubmittedAt,
          maById: rec?.maById,
          elix: rElix,
          category: rElix ? elixCategory(rElix) : null,
        };
      }
    });

    const mappedPeriodIds = new Set(allPeriods.map(p => p.id));
    const extraRecords = awardee.assessmentRecords
      .filter(r => !mappedPeriodIds.has(r.periodId))
      .map(r => {
        const rSA = !!r.hasFilledSA;
        const rMA = !!r.hasFilledMA;
        const rRaw = blendedScore(r.saScore || 0, r.maScore || 0, rSA, rMA);
        const rElix = (rSA || rMA) ? toElixIndex(rRaw) : null;
        return {
          ...r,
          isLive: false,
          elix: rElix,
          category: rElix ? elixCategory(rElix) : null,
        };
      });

    const fullHistory = [...cycles, ...extraRecords];
    const activePeriod = allPeriods.find(p => p.isActive) || null;

    return NextResponse.json({
      ...awardee,
      elix,
      category: elix ? elixCategory(elix) : null,
      activePeriod,
      history: fullHistory,
      cycles: fullHistory
    });
  } catch (error) {
    console.error('Error fetching awardee detail:', error);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}
