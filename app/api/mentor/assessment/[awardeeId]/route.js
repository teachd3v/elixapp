import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { computeScores, validateResponses } from '@/lib/assessment';

// Returns the awardee's profile only if it belongs to the mentor's region.
async function loadAuthorized(me, awardeeId) {
  const mentor = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
  if (!mentor) return null;
  const profile = await prisma.awardeeProfile.findUnique({ where: { id: awardeeId } });
  if (!profile || profile.wilayahId !== mentor.wilayahId) return null;
  return profile;
}

// GET /api/mentor/assessment/[awardeeId] — the MA the mentor has on this awardee.
export async function GET(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR') return new NextResponse('Forbidden', { status: 403 });

  const { awardeeId } = await params;
  const profile = await loadAuthorized(me, awardeeId);
  if (!profile) return new NextResponse('Awardee tidak ditemukan di wilayahmu', { status: 403 });

  return NextResponse.json({
    hasFilledMA: profile.hasFilledMA,
    maScore: profile.maScore,
    maDimensionScores: profile.maDimensionScores,
    maResponses: profile.maResponses,
  });
}

// POST /api/mentor/assessment/[awardeeId] — submit MA for this awardee.
// Body: { responses: { statementId: 1-4 } }. Score computed server-side.
export async function POST(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR') return new NextResponse('Forbidden', { status: 403 });

  const { awardeeId } = await params;
  const profile = await loadAuthorized(me, awardeeId);
  if (!profile) {
    return NextResponse.json({ error: 'Awardee tidak ditemukan di wilayahmu.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const responses = body.responses;
  const err = validateResponses(responses);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { dimensionScores, saScore: maScore } = computeScores(responses);

  const updated = await prisma.awardeeProfile.update({
    where: { id: awardeeId },
    data: {
      maResponses: responses,
      maDimensionScores: dimensionScores,
      maScore,
      hasFilledMA: true,
      maSubmittedAt: new Date(),
      maById: me.id,
    },
    select: { hasFilledMA: true, maScore: true, maDimensionScores: true, maSubmittedAt: true },
  });

  return NextResponse.json(updated);
}
