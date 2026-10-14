import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'AWARDEE' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const queryAwardeeId = url.searchParams.get('awardeeId');

  let awardeeProfile = null;
  if (me.role === 'AWARDEE') {
    awardeeProfile = await prisma.awardeeProfile.findUnique({
      where: { userId: me.id },
      include: {
        wilayah: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });
  } else if (me.role === 'SUPERADMIN' && queryAwardeeId) {
    awardeeProfile = await prisma.awardeeProfile.findUnique({
      where: { id: queryAwardeeId },
      include: {
        wilayah: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });
  }

  if (!awardeeProfile) {
    return NextResponse.json({
      awardee: null,
      records: [],
    });
  }

  const records = await prisma.awardeeInterviewRecord.findMany({
    where: { awardeeId: awardeeProfile.id },
    orderBy: { interviewDate: 'desc' },
    include: {
      evaluatedBy: { select: { id: true, name: true, avatarUrl: true } },
      awardee: {
        select: {
          id: true,
          wilayah: { select: { id: true, name: true } },
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({
    awardee: awardeeProfile,
    records,
  });
}
