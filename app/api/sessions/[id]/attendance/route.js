import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { isAttendanceOpen, attendanceStatusText } from '@/lib/attendance-window';

// Cap client photo size so we don't fill the DB with an accidental 10 MB PNG.
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB after base64
function b64Size(s) {
  if (typeof s !== 'string' || !s.startsWith('data:')) return -1;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}

// Return true iff the current AWARDEE / MENTOR / SUPERADMIN is allowed to see
// this session at all (matches the /api/sessions visibility rules).
async function canSeeSession(me, session) {
  if (me.role === 'SUPERADMIN') return true;
  if (session.scope === 'NASIONAL') return true;
  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id } });
    return !!mp && mp.wilayahId === session.wilayahId;
  }
  if (me.role === 'AWARDEE') {
    const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id } });
    return !!ap && ap.wilayahId === session.wilayahId;
  }
  return false;
}

// GET /api/sessions/[id]/attendance — list attendance for a session.
// AWARDEE: only their own row (or []); MENTOR/SUPERADMIN: all rows.
export async function GET(_request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const { id: sessionId } = await params;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return new NextResponse('Sesi tidak ditemukan', { status: 404 });
  if (!(await canSeeSession(me, session))) return new NextResponse('Forbidden', { status: 403 });

  let where = { sessionId };
  if (me.role === 'AWARDEE') {
    const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { id: true } });
    if (!ap) return NextResponse.json([]);
    where.awardeeId = ap.id;
  }

  const rows = await prisma.attendance.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true, status: true, notes: true, submittedAt: true, verifiedAt: true, verifiedById: true,
      // Photos can be big — include them only for MENTOR/SUPERADMIN or the awardee's own row.
      selfiePhoto: true, atmospherePhoto: true,
      excuseCategory: true, excuseReason: true, excusePhoto: true,
      awardee: {
        select: {
          id: true, wilayahId: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });
  return NextResponse.json(rows);
}

// POST /api/sessions/[id]/attendance — awardee submits attendance.
// Body: { selfiePhoto, atmospherePhoto, notes? }. Both photos required (data URLs).
// If a row exists AND is still MENUNGGU_KONFIRMASI, this replaces the photos.
// If a row exists AND has been verified (HADIR/ALFA), the request is rejected.
export async function POST(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'AWARDEE') return new NextResponse('Forbidden', { status: 403 });

  const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { id: true, wilayahId: true } });
  if (!ap) return NextResponse.json({ error: 'Lengkapi profil awardee dulu.' }, { status: 400 });

  const { id: sessionId } = await params;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return new NextResponse('Sesi tidak ditemukan', { status: 404 });

  // Awardee can only attend Nasional sessions or sessions in their own wilayah.
  const visible = session.scope === 'NASIONAL' || session.wilayahId === ap.wilayahId;
  if (!visible) return new NextResponse('Sesi tidak tersedia untukmu', { status: 403 });

  // Time-window guard: attendance is only allowed on the session day, within
  // the session's time range (see lib/attendance-window.js).
  if (!isAttendanceOpen(session)) {
    return NextResponse.json({ error: attendanceStatusText(session) }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { selfiePhoto, atmospherePhoto, notes } = body;
  for (const [label, p] of [['Selfie', selfiePhoto], ['Suasana', atmospherePhoto]]) {
    const size = b64Size(p);
    if (size < 0) return NextResponse.json({ error: `Foto ${label} tidak valid.` }, { status: 400 });
    if (size === 0) return NextResponse.json({ error: `Foto ${label} wajib diunggah.` }, { status: 400 });
    if (size > MAX_PHOTO_BYTES) return NextResponse.json({ error: `Foto ${label} terlalu besar (>2 MB).` }, { status: 400 });
  }

  const existing = await prisma.attendance.findUnique({
    where: { sessionId_awardeeId: { sessionId, awardeeId: ap.id } },
  });
  if (existing && existing.status !== 'MENUNGGU_KONFIRMASI') {
    return NextResponse.json(
      { error: `Absensi kamu sudah diverifikasi (${existing.status}). Hubungi mentor jika perlu diubah.` },
      { status: 409 }
    );
  }

  // If the awardee had previously submitted an excuse in MENUNGGU status,
  // switching to a photo attendance should clear the excuse fields.
  const row = await prisma.attendance.upsert({
    where: { sessionId_awardeeId: { sessionId, awardeeId: ap.id } },
    create: {
      sessionId, awardeeId: ap.id,
      selfiePhoto, atmospherePhoto,
      notes: notes?.trim() || null,
      status: 'MENUNGGU_KONFIRMASI',
    },
    update: {
      selfiePhoto, atmospherePhoto,
      notes: notes?.trim() || null,
      excuseCategory: null, excuseReason: null, excusePhoto: null,
      submittedAt: new Date(),
    },
    select: { id: true, status: true, submittedAt: true },
  });
  return NextResponse.json(row, { status: 201 });
}
