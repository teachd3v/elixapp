import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { blendedScore, toElixIndex } from '@/lib/assessment';

// GET /api/mentor/awardees — awardees in the current mentor's region, with
// their SA/MA status. MENTOR only.
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR') return new NextResponse('Forbidden', { status: 403 });

  const mentor = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
  if (!mentor) {
    return NextResponse.json({ wilayah: null, awardees: [], trend: [], dimensionAverages: [] });
  }

  const [wilayah, awardees, periods, dimensions] = await Promise.all([
    prisma.wilayah.findUnique({ where: { id: mentor.wilayahId }, select: { id: true, name: true } }),
    prisma.awardeeProfile.findMany({
      where: { wilayahId: mentor.wilayahId },
      select: {
        id: true,
        school: true,
        generation: true,
        saScore: true,
        hasFilledSA: true,
        maScore: true,
        hasFilledMA: true,
        saDimensionScores: true,
        maDimensionScores: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { user: { name: 'asc' } },
    }),
    prisma.assessmentPeriod.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        records: {
          where: { awardee: { wilayahId: mentor.wilayahId } },
          select: { saScore: true, maScore: true, hasFilledSA: true, hasFilledMA: true }
        }
      }
    }),
    prisma.dimension.findMany({ orderBy: { order: 'asc' } }),
  ]);

  const trend = periods.map(p => {
    const scored = p.records.map(r => {
      const hasSA = !!r.hasFilledSA;
      const hasMA = !!r.hasFilledMA;
      const raw = blendedScore(r.saScore || 0, r.maScore || 0, hasSA, hasMA);
      return (hasSA || hasMA) ? toElixIndex(raw) : null;
    }).filter(e => e != null);
    
    return {
      periodId: p.id,
      name: p.name,
      avgElix: scored.length ? parseFloat((scored.reduce((s, v) => s + v, 0) / scored.length).toFixed(1)) : 0
    };
  });

  // Append current un-finalized cycle data
  const currentScored = awardees.map(a => {
    const hasSA = !!a.hasFilledSA;
    const hasMA = !!a.hasFilledMA;
    const raw = blendedScore(a.saScore || 0, a.maScore || 0, hasSA, hasMA);
    return (hasSA || hasMA) ? toElixIndex(raw) : null;
  }).filter(e => e != null);
  
  if (currentScored.length > 0 || trend.length === 0) {
    trend.push({
      periodId: 'current',
      name: 'Saat Ini',
      avgElix: currentScored.length ? parseFloat((currentScored.reduce((s, v) => s + v, 0) / currentScored.length).toFixed(1)) : 0
    });
  }

  const dimensionAverages = dimensions.map((dim) => {
    const values = awardees.map((a) => {
      const sa = a.hasFilledSA ? a.saScore && a.saDimensionScores?.[dim.id] : null;
      const ma = a.hasFilledMA ? a.maScore && a.maDimensionScores?.[dim.id] : null;
      if (sa != null && ma != null) return 0.4 * sa + 0.6 * ma;
      if (sa != null) return sa;
      if (ma != null) return ma;
      return null;
    }).filter((v) => v != null);
    return {
      id: dim.id,
      name: dim.name,
      color: dim.color,
      avg: values.length ? parseFloat((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2)) : 0,
    };
  });

  return NextResponse.json({ wilayah, awardees, trend, dimensionAverages });
}

