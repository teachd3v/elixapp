import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// POST /api/announcements/[id]/read — mark 1 pengumuman sebagai dibaca oleh user.
// Idempotent (composite unique key).
export async function POST(_request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id: announcementId } = await params;
  const a = await prisma.announcement.findUnique({ where: { id: announcementId }, select: { id: true } });
  if (!a) return new NextResponse('Pengumuman tidak ditemukan', { status: 404 });

  await prisma.announcementRead.upsert({
    where: { announcementId_userId: { announcementId, userId: me.id } },
    create: { announcementId, userId: me.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
