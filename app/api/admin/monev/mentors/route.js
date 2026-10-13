import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/mentors — List mentor profiles with Wilayah and performance evaluations history
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const mentors = await prisma.mentorProfile.findMany({
    orderBy: [
      { wilayah: { name: 'asc' } },
      { user: { name: 'asc' } },
    ],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          phone: true,
        },
      },
      wilayah: {
        select: {
          id: true,
          name: true,
        },
      },
      performanceEvaluations: {
        orderBy: { createdAt: 'desc' },
        include: {
          evaluatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return NextResponse.json(mentors);
}
