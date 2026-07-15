import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { feedWhere } from '../route';

// POST /api/announcements/read-all — mark semua pengumuman DI FEED user
// (bell notifikasi) sebagai dibaca. Menggunakan feedWhere yang sama supaya
// konsisten dengan apa yang user lihat di bell.
export async function POST() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const where = await feedWhere(me);
  const ann = await prisma.announcement.findMany({ where, select: { id: true } });
  const created = await prisma.announcementRead.createMany({
    data: ann.map((a) => ({ announcementId: a.id, userId: me.id })),
    skipDuplicates: true,
  });
  return NextResponse.json({ ok: true, marked: created.count });
}
