import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getCurrentDbUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const periods = await prisma.assessmentPeriod.findMany({
      orderBy: { startDate: 'asc' },
    });
    
    return NextResponse.json(periods);
  } catch (error) {
    console.error('GET /api/admin/periods error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentDbUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, startDate, endDate, isActive } = body;

    // Create the period
    const newPeriod = await prisma.assessmentPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: !!isActive,
      }
    });

    // If this new one is active, we should deactivate others
    if (isActive) {
      await prisma.assessmentPeriod.updateMany({
        where: { id: { not: newPeriod.id } },
        data: { isActive: false }
      });
      // We would also need to load/clear awardee profiles here, but for simplicity we'll handle activation via a separate PATCH route or do it here.
      // To keep it simple, we'll let the PATCH route handle "activation" logic to sync profiles.
    }

    return NextResponse.json(newPeriod);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
