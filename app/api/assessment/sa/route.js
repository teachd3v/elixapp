import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { computeSaScores, validateSaResponses } from '@/lib/assessment';

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
    },
  });

  return NextResponse.json(profile || { hasFilledSA: false });
}

// POST /api/assessment/sa — submit self-assessment. Body: { responses: { statementId: 1-4 } }.
// The score is computed server-side (never trusted from the client).
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'AWARDEE') return new NextResponse('Forbidden', { status: 403 });

  const profile = await prisma.awardeeProfile.findUnique({ where: { userId: me.id } });
  if (!profile) {
    return NextResponse.json({ error: 'Lengkapi profil dulu sebelum mengisi Self Assessment.' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const responses = body.responses;

  const err = validateSaResponses(responses);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { dimensionScores, saScore } = computeSaScores(responses);

  const updated = await prisma.awardeeProfile.update({
    where: { userId: me.id },
    data: {
      saResponses: responses,
      saDimensionScores: dimensionScores,
      saScore,
      hasFilledSA: true,
      saSubmittedAt: new Date(),
    },
    select: { hasFilledSA: true, saScore: true, saDimensionScores: true, saSubmittedAt: true },
  });

  return NextResponse.json(updated);
}
