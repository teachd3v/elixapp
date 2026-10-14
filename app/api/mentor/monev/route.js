import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const queryMentorId = url.searchParams.get('mentorId');

  let mentorProfile = null;
  if (me.role === 'MENTOR') {
    mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: me.id },
      include: {
        wilayah: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });
  } else if (me.role === 'SUPERADMIN' && queryMentorId) {
    mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: queryMentorId },
      include: {
        wilayah: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });
  }

  if (!mentorProfile) {
    return NextResponse.json({
      mentor: null,
      performanceEvaluations: [],
      teachingEvaluations: [],
      wilayahObservations: [],
      plans: [],
      teachingAspects: [],
    });
  }

  const [
    performanceEvaluations,
    teachingEvaluations,
    wilayahObservations,
    plans,
    teachingAspects,
  ] = await Promise.all([
    prisma.mentorPerformanceEvaluation.findMany({
      where: { mentorId: mentorProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        evaluatedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    prisma.mentorTeachingEvaluation.findMany({
      where: { mentorId: mentorProfile.id },
      orderBy: { evaluationDate: 'desc' },
      include: {
        evaluatedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    }),
    mentorProfile.wilayahId
      ? prisma.wilayahMonevObservation.findMany({
          where: { wilayahId: mentorProfile.wilayahId },
          orderBy: { observationDate: 'desc' },
          include: {
            wilayah: { select: { id: true, name: true } },
            evaluatedBy: { select: { id: true, name: true, avatarUrl: true } },
          },
        })
      : Promise.resolve([]),
    prisma.mentorPerformancePlan.findMany({
      orderBy: { order: 'asc' },
      include: {
        targets: { orderBy: { order: 'asc' } },
      },
    }),
    prisma.mentorTeachingAspect.findMany({
      orderBy: { order: 'asc' },
      include: {
        indicators: { orderBy: { order: 'asc' } },
      },
    }),
  ]);

  return NextResponse.json({
    mentor: mentorProfile,
    performanceEvaluations,
    teachingEvaluations,
    wilayahObservations,
    plans,
    teachingAspects,
  });
}
