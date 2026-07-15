import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/sessions — list sessions visible to the current user.
// - AWARDEE / MENTOR: sessions in their wilayah + all NASIONAL sessions.
// - SUPERADMIN: everything.
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  let where;
  if (me.role === 'SUPERADMIN') {
    where = undefined;
  } else if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    where = mp ? { OR: [{ scope: 'NASIONAL' }, { wilayahId: mp.wilayahId }] } : { scope: 'NASIONAL' };
  } else if (me.role === 'AWARDEE') {
    const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    where = ap ? { OR: [{ scope: 'NASIONAL' }, { wilayahId: ap.wilayahId }] } : { scope: 'NASIONAL' };
  } else {
    return NextResponse.json([]);
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { date: 'desc' },
    select: {
      id: true, title: true, date: true, time: true, scope: true,
      createdById: true,
      wilayah: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(sessions);
}

// POST /api/sessions — create a session.
// MENTOR creates WILAYAH sessions (auto-scoped to their wilayah);
// SUPERADMIN creates NASIONAL sessions.
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, date, time } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 });
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) {
    return NextResponse.json({ error: 'Tanggal tidak valid.' }, { status: 400 });
  }

  const data = {
    title: title.trim(),
    date: d,
    time: time?.trim() || null,
    createdById: me.id,
  };

  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
    if (!mp) return NextResponse.json({ error: 'Lengkapi profil mentor dulu.' }, { status: 400 });
    data.scope = 'WILAYAH';
    data.mentorId = mp.id;
    data.wilayahId = mp.wilayahId;
  } else {
    data.scope = 'NASIONAL';
  }

  const created = await prisma.session.create({
    data,
    select: {
      id: true, title: true, date: true, time: true, scope: true, createdById: true,
      wilayah: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(created, { status: 201 });
}
