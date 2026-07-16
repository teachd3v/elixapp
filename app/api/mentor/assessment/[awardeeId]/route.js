import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { computeScores, validateResponses } from '@/lib/assessment';

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

  const period = await checkActivePeriod();

  return NextResponse.json({
    hasFilledMA: profile.hasFilledMA,
    maScore: profile.maScore,
    maDimensionScores: profile.maDimensionScores,
    maResponses: profile.maResponses,
    periodActive: period.active,
    periodStatus: period.status,
    periodName: period.name,
    periodStart: period.start,
    periodEnd: period.end
  });
}

// POST /api/mentor/assessment/[awardeeId] — submit MA for this awardee.
// Body: { responses: { statementId: 1-4 } }. Score computed server-side.
export async function POST(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR') return new NextResponse('Forbidden', { status: 403 });

  const period = await checkActivePeriod();
  if (!period.active) {
    return NextResponse.json({ error: 'Tidak ada siklus penilaian yang aktif saat ini, atau berada di luar batas waktu pengisian.' }, { status: 400 });
  }

  const { awardeeId } = await params;
  const profile = await loadAuthorized(me, awardeeId);
  if (!profile) {
    return NextResponse.json({ error: 'Awardee tidak ditemukan di wilayahmu.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const responses = body.responses;
  // Fetch dynamic instruments from DB
  const dimensions = await prisma.dimension.findMany({ orderBy: { order: 'asc' } });
  const statements = await prisma.statement.findMany({ orderBy: { order: 'asc' } });

  const err = validateResponses(responses, statements);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { dimensionScores, saScore: maScore } = computeScores(responses, dimensions, statements);

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
