import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const superadmins = await prisma.user.findMany({
    where: { role: 'SUPERADMIN' },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    currentObserverId: me.id,
    currentObserver: {
      id: me.id,
      name: me.name,
      email: me.email,
      avatarUrl: me.avatarUrl,
    },
    observers: superadmins,
  });
}
