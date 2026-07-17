import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { blendedScore, toElixIndex, elixCategory } from '@/lib/assessment';

// GET /api/admin/stats — aggregated data for the SUPERADMIN dashboard &
// ELIX analysis: totals, per-wilayah rollups, per-awardee ELIX.
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const [users, wilayahList, awardees, mentors, superadmins, dimensions, periods] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.wilayah.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.awardeeProfile.findMany({
      select: {
        id: true, wilayahId: true, school: true, generation: true, university: true, major: true, gpa: true, birthInfo: true, gender: true, address: true,
        saScore: true, hasFilledSA: true, saDimensionScores: true,
        maScore: true, hasFilledMA: true, maDimensionScores: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
      },
    }),
    prisma.mentorProfile.findMany({
      select: {
        id: true, wilayahId: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true, phone: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'SUPERADMIN' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, avatarUrl: true },
    }),
    prisma.dimension.findMany({ orderBy: { order: 'asc' } }),
    prisma.assessmentPeriod.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        records: {
          select: { saScore: true, maScore: true, hasFilledSA: true, hasFilledMA: true }
        }
      }
    })
  ]);

  const roleCounts = Object.fromEntries(users.map((u) => [u.role, u._count._all]));

  const enrichedAwardees = awardees.map((a) => {
    const hasSA = !!a.hasFilledSA;
    const hasMA = !!a.hasFilledMA;
    const raw = blendedScore(a.saScore || 0, a.maScore || 0, hasSA, hasMA);
    const elix = (hasSA || hasMA) ? toElixIndex(raw) : null;
    return {
      id: a.id,
      wilayahId: a.wilayahId,
      school: a.school,
      generation: a.generation,
      university: a.university,
      major: a.major,
      gpa: a.gpa,
      birthInfo: a.birthInfo,
      gender: a.gender,
      address: a.address,
      saScore: a.saScore,
      maScore: a.maScore,
      hasFilledSA: hasSA,
      hasFilledMA: hasMA,
      elix,
      category: elix == null ? null : elixCategory(elix),
      user: a.user,
    };
  });

  const scored = enrichedAwardees.filter((a) => a.elix != null);
  const nationalElix = scored.length
    ? parseFloat((scored.reduce((s, a) => s + a.elix, 0) / scored.length).toFixed(1))
    : null;

  const wilayahRollup = wilayahList.map((w) => {
    const wa = enrichedAwardees.filter((a) => a.wilayahId === w.id);
    const ws = wa.filter((a) => a.elix != null);
    const mentor = mentors.find((m) => m.wilayahId === w.id) || null;
    return {
      id: w.id,
      name: w.name,
      awardeeCount: wa.length,
      saFilled: wa.filter((a) => a.hasFilledSA).length,
      maFilled: wa.filter((a) => a.hasFilledMA).length,
      avgElix: ws.length ? parseFloat((ws.reduce((s, a) => s + a.elix, 0) / ws.length).toFixed(1)) : null,
      mentor: mentor?.user || null,
    };
  });

  // Per-dimension national average (from whichever score is available).
  const dimensionAverages = dimensions.map((dim) => {
    const values = enrichedAwardees.map((a) => {
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

  // Calculate historical trend
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

  return NextResponse.json({
    roleCounts,
    totals: {
      users: Object.values(roleCounts).reduce((s, n) => s + n, 0),
      awardees: awardees.length,
      mentors: mentors.length,
      wilayah: wilayahList.length,
      saFilled: enrichedAwardees.filter((a) => a.hasFilledSA).length,
      maFilled: enrichedAwardees.filter((a) => a.hasFilledMA).length,
    },
    nationalElix,
    trend,
    wilayahRollup,
    dimensionAverages,
    awardees: enrichedAwardees,
    mentors: mentors.map((m) => ({ id: m.id, wilayahId: m.wilayahId, user: m.user })),
    superadmins,
  });
}
