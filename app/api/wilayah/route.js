import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/wilayah — list program coaching regions for the profile form.
// Any signed-in user may read this. Includes mentor count (max 2 per wilayah).
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const wilayah = await prisma.wilayah.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { mentorProfiles: true } },
      mentorProfiles: {
        select: {
          userId: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(
    wilayah.map((w) => ({
      id: w.id,
      name: w.name,
      mentorCount: w._count.mentorProfiles,
      maxMentors: 2,
      mentorUserIds: w.mentorProfiles.map((m) => m.userId),
      mentorNames: w.mentorProfiles.map((m) => m.user?.name).filter(Boolean),
    }))
  );
}
