import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/users — list all users. SUPERADMIN only.
// Used by the "Manajemen User" panel to review and approve pending accounts.
export async function GET() {
  const me = await getCurrentDbUser();

  if (!me) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isProfileComplete: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}
