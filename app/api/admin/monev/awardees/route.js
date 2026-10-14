import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/awardees — List awardee profiles with Wilayah and interview records history
export async function GET(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const wilayahId = url.searchParams.get('wilayahId');

  const where = {};
  if (wilayahId) where.wilayahId = wilayahId;

  try {
    const awardees = await prisma.awardeeProfile.findMany({
      where,
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
            mentorProfiles: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        interviewRecords: {
          orderBy: { createdAt: 'desc' },
          include: {
            evaluatedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(awardees);
  } catch (error) {
    console.error('Error fetching awardees for monev:', error);
    return NextResponse.json({ error: 'Gagal mengambil data awardee.' }, { status: 500 });
  }
}
