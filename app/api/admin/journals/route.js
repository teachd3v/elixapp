import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const me = await getCurrentDbUser();
    if (!me) return new NextResponse('Unauthorized', { status: 401 });
    if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

    const url = new URL(request.url);
    const wilayahId = url.searchParams.get('wilayahId');
    const mentorId = url.searchParams.get('mentorId');
    const activityName = url.searchParams.get('activityName');
    const locationType = url.searchParams.get('locationType');
    const search = url.searchParams.get('search')?.trim();
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const where = {};

    if (mentorId && mentorId !== 'ALL') {
      where.mentorId = mentorId;
    } else if (wilayahId && wilayahId !== 'ALL') {
      where.mentor = { wilayahId };
    }

    if (activityName && activityName !== 'ALL') {
      where.activityName = activityName;
    }

    if (locationType && locationType !== 'ALL') {
      where.locationType = locationType;
    }

    if (startDate || endDate) {
      where.activityDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.activityDate.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.activityDate.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { journalCode: { contains: search, mode: 'insensitive' } },
        { activityName: { contains: search, mode: 'insensitive' } },
        { locationDetail: { contains: search, mode: 'insensitive' } },
        { qualitativeAchievement: { contains: search, mode: 'insensitive' } },
        { quantitativeAchievement: { contains: search, mode: 'insensitive' } },
        { problemIdentification: { contains: search, mode: 'insensitive' } },
        { improvementPlan: { contains: search, mode: 'insensitive' } },
        { mentor: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { mentor: { wilayah: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Fetch journals according to filters
    const [journals, wilayahList, mentorList] = await Promise.all([
      prisma.mentorJournal.findMany({
        where,
        orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          mentor: {
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
            },
          },
        },
      }),
      prisma.wilayah.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.mentorProfile.findMany({
        select: {
          id: true,
          wilayahId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          wilayah: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { wilayah: { name: 'asc' } },
          { user: { name: 'asc' } },
        ],
      }),
    ]);

    // Calculate aggregated metrics for the summary banner
    const totalJournals = journals.length;
    const uniqueMentorIds = new Set(journals.map((j) => j.mentorId));
    const uniqueMentorsCount = uniqueMentorIds.size;
    const totalMentorsCount = mentorList.length;

    const activityCounts = {};
    const wilayahCounts = {};

    for (const j of journals) {
      activityCounts[j.activityName] = (activityCounts[j.activityName] || 0) + 1;
      const wName = j.mentor?.wilayah?.name || 'Lainnya';
      wilayahCounts[wName] = (wilayahCounts[wName] || 0) + 1;
    }

    let topActivity = '—';
    let topActivityCount = 0;
    for (const [act, count] of Object.entries(activityCounts)) {
      if (count > topActivityCount) {
        topActivityCount = count;
        topActivity = act;
      }
    }

    let mostActiveWilayah = '—';
    let mostActiveWilayahCount = 0;
    for (const [w, count] of Object.entries(wilayahCounts)) {
      if (count > mostActiveWilayahCount) {
        mostActiveWilayahCount = count;
        mostActiveWilayah = w;
      }
    }

    return NextResponse.json({
      journals,
      summary: {
        totalJournals,
        uniqueMentorsCount,
        totalMentorsCount,
        topActivity,
        topActivityCount,
        mostActiveWilayah,
        mostActiveWilayahCount,
      },
      filterOptions: {
        wilayahList,
        mentorList,
      },
    });
  } catch (error) {
    console.error('Error fetching admin journals:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data jurnal mentor', details: error.message },
      { status: 500 }
    );
  }
}
