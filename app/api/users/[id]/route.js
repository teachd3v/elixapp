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

// DELETE /api/users/[id] — permanently delete a user (reject pending or remove account).
// SUPERADMIN only. Cleans up associated profiles/sessions and deletes from Clerk.
export async function DELETE(request, { params }) {
  const me = await getCurrentDbUser();

  if (!me) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { id } = await params;

  // Guard: don't let a superadmin delete their own account
  if (id === me.id) {
    return NextResponse.json(
      { error: 'Anda tidak dapat menghapus akun Anda sendiri.' },
      { status: 400 }
    );
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      include: { awardeeProfile: true, mentorProfile: true },
    });

    if (!target) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Clean up dependent relations that don't have onDelete: Cascade
    await prisma.$transaction(async (tx) => {
      // 1. If awardee, clean up individual sessions referencing awardeeId
      if (target.awardeeProfile) {
        await tx.session.deleteMany({
          where: { awardeeId: target.awardeeProfile.id },
        });
      }

      // 2. If mentor, delete sessions linked to mentorId
      if (target.mentorProfile) {
        await tx.session.deleteMany({
          where: { mentorId: target.mentorProfile.id },
        });
      }

      // 3. Delete any sessions created by this user
      await tx.session.deleteMany({
        where: { createdById: id },
      });

      // 4. Delete any announcements created by this user
      await tx.announcement.deleteMany({
        where: { createdById: id },
      });

      // 5. Delete user (cascades to awardeeProfile/mentorProfile/announcementReads)
      await tx.user.delete({
        where: { id },
      });
    });

    // Try deleting from Clerk if clerkId exists
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      if (target.clerkId) {
        await client.users.deleteUser(target.clerkId);
      }
    } catch (clerkErr) {
      console.warn('Clerk deletion skipped or failed:', clerkErr.message);
    }

    return NextResponse.json({ success: true, message: `Akun ${target.email} berhasil dihapus.` });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: `Gagal menghapus user: ${error.message}` }, { status: 500 });
  }
}
