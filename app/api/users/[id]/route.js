import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

const VALID_ROLES = ['UNVERIFIED', 'AWARDEE', 'MENTOR', 'SUPERADMIN'];

// PATCH /api/users/[id] — set a user's role (i.e. approve a pending account).
// SUPERADMIN only. Body: { role: "AWARDEE" | "MENTOR" | "SUPERADMIN" | "UNVERIFIED" }.
export async function PATCH(request, { params }) {
  const me = await getCurrentDbUser();

  if (!me) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Next.js 16: dynamic route params are async.
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { role } = body;

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Expected one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 }
    );
  }

  // Guard: don't let a superadmin accidentally strip their own access.
  if (id === me.id && role !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: 'You cannot change your own SUPERADMIN role.' },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    // Prisma P2025 = record not found
    if (error.code === 'P2025') {
      return new NextResponse('User not found', { status: 404 });
    }
    console.error('Error updating user role:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
