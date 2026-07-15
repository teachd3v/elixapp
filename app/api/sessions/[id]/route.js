import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// Only the creator (or a SUPERADMIN) may edit or delete a session.
async function loadForMutation(me, id) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return { session: null, allowed: false };
  const allowed = me.role === 'SUPERADMIN' || session.createdById === me.id;
  return { session, allowed };
}

// PATCH /api/sessions/[id] — edit title/date/time. Scope/wilayah are immutable.
export async function PATCH(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await params;
  const { session, allowed } = await loadForMutation(me, id);
  if (!session) return new NextResponse('Sesi tidak ditemukan', { status: 404 });
  if (!allowed) return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const data = {};

  if (typeof body.title === 'string') {
    if (!body.title.trim()) return NextResponse.json({ error: 'Judul tidak boleh kosong.' }, { status: 400 });
    data.title = body.title.trim();
  }
  if (body.date !== undefined) {
    const d = new Date(body.date);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Tanggal tidak valid.' }, { status: 400 });
    data.date = d;
  }
  if (body.time !== undefined) {
    data.time = body.time?.trim() || null;
  }

  const updated = await prisma.session.update({
    where: { id },
    data,
    select: {
      id: true, title: true, date: true, time: true, scope: true, createdById: true,
      wilayah: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(updated);
}

// DELETE /api/sessions/[id] — attendances cascade (Attendance.onDelete: Cascade).
export async function DELETE(_request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await params;
  const { session, allowed } = await loadForMutation(me, id);
  if (!session) return new NextResponse('Sesi tidak ditemukan', { status: 404 });
  if (!allowed) return new NextResponse('Forbidden', { status: 403 });

  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
