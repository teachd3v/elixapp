import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { computeSaScores, validateSaResponses } from '@/lib/assessment';

async function checkActivePeriod() {
  const p = await prisma.assessmentPeriod.findFirst({ where: { isActive: true } });
  if (!p) return { active: false, status: 'NONE', name: null };
  const now = new Date();
  const start = new Date(p.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(p.endDate);
  end.setHours(23, 59, 59, 999);
  
  let status = 'ACTIVE';
  if (now < start) status = 'NOT_STARTED';
  else if (now > end) status = 'ENDED';

  return {
    active: status === 'ACTIVE',
    status,
    name: p.name,
    start: p.startDate,
    end: p.endDate
  };
}

// GET /api/assessment/sa — current awardee's SA status/scores (or empty).
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'AWARDEE') return new NextResponse('Forbidden', { status: 403 });

  const profile = await prisma.awardeeProfile.findUnique({
    where: { userId: me.id },
    select: {
      hasFilledSA: true,
      saScore: true,
      saDimensionScores: true,
      saResponses: true,
      saSubmittedAt: true,
      hasFilledMA: true,
      maScore: true,
      maDimensionScores: true,
    },
  });
  
  const period = await checkActivePeriod();
  
  return NextResponse.json({
    ...(profile || { hasFilledSA: false }),
    periodActive: period.active,
    periodStatus: period.status,
    periodName: period.name,
    periodStart: period.start,
    periodEnd: period.end
  });
}

// POST /api/assessment/sa — submit self-assessment. Body: { responses: { statementId: 1-4 } }.
// The score is computed server-side (never trusted from the client).
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'AWARDEE') return new NextResponse('Forbidden', { status: 403 });

  const period = await checkActivePeriod();
  if (!period.active) {
    return NextResponse.json({ error: 'Tidak ada siklus penilaian yang aktif saat ini, atau berada di luar batas waktu pengisian.' }, { status: 400 });
  }

  const profile = await prisma.awardeeProfile.findUnique({ where: { userId: me.id } });
  if (!profile) {
    return NextResponse.json({ error: 'Lengkapi profil dulu sebelum mengisi Self Assessment.' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const responses = body.responses;

  // Fetch dynamic instruments from DB
  const dimensions = await prisma.dimension.findMany({ orderBy: { order: 'asc' } });
  const statements = await prisma.statement.findMany({ orderBy: { order: 'asc' } });

  const err = validateSaResponses(responses, statements);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { dimensionScores, saScore } = computeSaScores(responses, dimensions, statements);

  const updated = await prisma.awardeeProfile.update({
    where: { userId: me.id },
    data: {
      saResponses: responses,
      saDimensionScores: dimensionScores,
      saScore,
      hasFilledSA: true,
      saSubmittedAt: new Date(),
    },
    select: { 
      hasFilledSA: true, 
      saScore: true, 
      saDimensionScores: true, 
      saSubmittedAt: true,
      hasFilledMA: true,
      maScore: true,
      maDimensionScores: true, 
    },
  });

  return NextResponse.json(updated);
}
