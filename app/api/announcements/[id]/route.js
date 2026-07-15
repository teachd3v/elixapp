import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// DELETE /api/announcements/[id] — hanya creator atau SUPERADMIN yang boleh hapus.
export async function DELETE(_request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await params;
  const a = await prisma.announcement.findUnique({ where: { id }, select: { createdById: true } });
  if (!a) return new NextResponse('Pengumuman tidak ditemukan', { status: 404 });
  if (me.role !== 'SUPERADMIN' && a.createdById !== me.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
