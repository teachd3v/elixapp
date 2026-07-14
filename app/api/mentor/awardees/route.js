import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/mentor/awardees — awardees in the current mentor's region, with
// their SA/MA status. MENTOR only.
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR') return new NextResponse('Forbidden', { status: 403 });

  const mentor = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
  if (!mentor) {
    return NextResponse.json({ wilayah: null, awardees: [] });
  }

  const [wilayah, awardees] = await Promise.all([
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
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { user: { name: 'asc' } },
    }),
  ]);

  return NextResponse.json({ wilayah, awardees });
}
