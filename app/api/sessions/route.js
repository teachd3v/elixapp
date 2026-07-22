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
    const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true, id: true } });
    where = ap ? { 
      OR: [
        { scope: 'NASIONAL' }, 
        { wilayahId: ap.wilayahId, category: 'KLASIKAL' },
        { category: 'INDIVIDU', awardeeId: ap.id }
      ] 
    } : { scope: 'NASIONAL' };
  } else {
    return NextResponse.json([]);
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { date: 'desc' },
    select: {
      id: true, title: true, date: true, time: true, scope: true, category: true, endDate: true, awardeeId: true,
      createdById: true,
      wilayah: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      awardee: { select: { id: true, user: { select: { name: true } } } },
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
  const { title, date, time, category = 'KLASIKAL', endDate, awardeeId, awardeeIds } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 });
  const d = new Date(date);
  if (!date || Number.isNaN(d.getTime())) {
    return NextResponse.json({ error: 'Waktu mulai tidak valid.' }, { status: 400 });
  }

  const baseData = {
    title: title.trim(),
    date: d,
    category,
    createdById: me.id,
  };

  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
    if (!mp) return NextResponse.json({ error: 'Lengkapi profil mentor dulu.' }, { status: 400 });
    baseData.scope = 'WILAYAH';
    baseData.mentorId = mp.id;
    baseData.wilayahId = mp.wilayahId;
  } else {
    baseData.scope = 'NASIONAL';
  }

  if (category === 'KLASIKAL') {
    const dEnd = new Date(endDate);
    if (!endDate || Number.isNaN(dEnd.getTime())) return NextResponse.json({ error: 'Waktu selesai wajib diisi untuk sesi klasikal.' }, { status: 400 });
    baseData.endDate = dEnd;
    
    const created = await prisma.session.create({
      data: baseData,
      select: {
        id: true, title: true, date: true, time: true, scope: true, category: true, endDate: true, awardeeId: true, createdById: true,
        wilayah: { select: { id: true, name: true } },
        awardee: { select: { id: true, user: { select: { name: true } } } },
      },
    });
    return NextResponse.json(created, { status: 201 });
  } else if (category === 'INDIVIDU') {
    const dEnd = new Date(endDate);
    if (!endDate || Number.isNaN(dEnd.getTime())) return NextResponse.json({ error: 'Tanggal akhir wajib diisi untuk sesi individu.' }, { status: 400 });
    
    const targetIds = awardeeIds || (awardeeId ? [awardeeId] : []);
    if (targetIds.length === 0) return NextResponse.json({ error: 'Minimal 1 Awardee wajib dipilih untuk sesi individu.' }, { status: 400 });
    
    // Create multiple sessions
    const createdSessions = await Promise.all(targetIds.map(async (id) => {
      return prisma.session.create({
        data: { ...baseData, endDate: dEnd, awardeeId: id },
        select: {
          id: true, title: true, date: true, time: true, scope: true, category: true, endDate: true, awardeeId: true, createdById: true,
          wilayah: { select: { id: true, name: true } },
          awardee: { select: { id: true, user: { select: { name: true } } } },
        },
      });
    }));
    return NextResponse.json(createdSessions[0], { status: 201 }); // Return the first one, frontend just triggers reload anyway
  }
}
