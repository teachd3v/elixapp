import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { isExcuseOpen, excuseStatusText } from '@/lib/attendance-window';

const CATEGORIES = ['SAKIT', 'AGENDA_KELUARGA', 'AGENDA_ORGANISASI', 'AGENDA_PRIBADI', 'LAINNYA'];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
function b64Size(s) {
  if (typeof s !== 'string' || !s.startsWith('data:')) return -1;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}

// POST /api/sessions/[id]/excuse — awardee submits an izin (leave request)
// for a session. Body: { excuseCategory, excuseReason, excusePhoto }.
// Upserts an Attendance row in MENUNGGU_KONFIRMASI carrying the excuse fields.
// Rejected once the row has been verified (HADIR/ALFA/IZIN).
export async function POST(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'AWARDEE') return new NextResponse('Forbidden', { status: 403 });

  const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { id: true, wilayahId: true } });
  if (!ap) return NextResponse.json({ error: 'Lengkapi profil awardee dulu.' }, { status: 400 });

  const { id: sessionId } = await params;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return new NextResponse('Sesi tidak ditemukan', { status: 404 });

  const visible = session.scope === 'NASIONAL' || session.wilayahId === ap.wilayahId;
  if (!visible) return new NextResponse('Sesi tidak tersedia untukmu', { status: 403 });

  const existing = await prisma.attendance.findUnique({
    where: { sessionId_awardeeId: { sessionId, awardeeId: ap.id } },
  });

  if (!isExcuseOpen(session, existing?.status)) {
    return NextResponse.json({ error: excuseStatusText(session, existing?.status) }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { excuseCategory, excuseReason, excusePhoto } = body;

  if (!CATEGORIES.includes(excuseCategory)) {
    return NextResponse.json({ error: `Kategori izin tidak valid. Pilih: ${CATEGORIES.join(', ')}` }, { status: 400 });
  }
  if (!excuseReason?.trim()) {
    return NextResponse.json({ error: 'Keterangan izin wajib diisi.' }, { status: 400 });
  }
  const size = b64Size(excusePhoto);
  if (size < 0) return NextResponse.json({ error: 'Foto bukti tidak valid.' }, { status: 400 });
  if (size === 0) return NextResponse.json({ error: 'Foto bukti wajib diunggah.' }, { status: 400 });
  if (size > MAX_PHOTO_BYTES) return NextResponse.json({ error: 'Foto bukti terlalu besar (>2 MB).' }, { status: 400 });

  const row = await prisma.attendance.upsert({
    where: { sessionId_awardeeId: { sessionId, awardeeId: ap.id } },
    create: {
      sessionId, awardeeId: ap.id,
      status: 'MENUNGGU_KONFIRMASI',
      excuseCategory, excuseReason: excuseReason.trim(), excusePhoto,
    },
    update: {
      excuseCategory, excuseReason: excuseReason.trim(), excusePhoto,
      // Switching from attendance to excuse — clear the attendance-side photos.
      selfiePhoto: null, atmospherePhoto: null, notes: null,
      submittedAt: new Date(),
    },
    select: { id: true, status: true, submittedAt: true },
  });
  return NextResponse.json(row, { status: 201 });
}
