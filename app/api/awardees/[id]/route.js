import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { blendedScore, toElixIndex, elixCategory } from '@/lib/assessment';

export async function GET(request, { params }) {
  try {
    const me = await getCurrentDbUser();
    if (!me) return new NextResponse('Unauthorized', { status: 401 });
    
    // Hanya Superadmin dan Mentor yang bisa mengakses detail awardee
    if (me.role !== 'SUPERADMIN' && me.role !== 'MENTOR') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { id } = await params;

    const awardee = await prisma.awardeeProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true, phone: true } },
        wilayah: true,
        portfolios: { orderBy: { date: 'desc' } },
        attendances: { 
          include: { session: true },
          orderBy: { session: { date: 'desc' } }
        },
        assessmentRecords: {
          include: { period: true },
          orderBy: { period: { startDate: 'asc' } }
        }
      }
    });

    if (!awardee) return new NextResponse('Not Found', { status: 404 });

    // Jika Mentor, pastikan awardee ini berada di wilayahnya
    if (me.role === 'MENTOR') {
      const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
      if (mp?.wilayahId !== awardee.wilayahId) {
        return new NextResponse('Forbidden: Not your region', { status: 403 });
      }
    }

    // Hitung elix saat ini
    const hasSA = !!awardee.hasFilledSA;
    const hasMA = !!awardee.hasFilledMA;
    const raw = blendedScore(awardee.saScore || 0, awardee.maScore || 0, hasSA, hasMA);
    const elix = (hasSA || hasMA) ? toElixIndex(raw) : null;
    
    // Siapkan records (history)
    const history = awardee.assessmentRecords.map(r => {
      const hSA = !!r.hasFilledSA;
      const hMA = !!r.hasFilledMA;
      const hRaw = blendedScore(r.saScore || 0, r.maScore || 0, hSA, hMA);
      const hElix = (hSA || hMA) ? toElixIndex(hRaw) : null;
      return {
        ...r,
        elix: hElix,
        category: hElix ? elixCategory(hElix) : null
      };
    });

    return NextResponse.json({
      ...awardee,
      elix,
      category: elix ? elixCategory(elix) : null,
      history
    });
  } catch (error) {
    console.error('Error fetching awardee detail:', error);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}
