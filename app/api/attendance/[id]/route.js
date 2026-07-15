import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

const VALID = ['MENUNGGU_KONFIRMASI', 'HADIR', 'ALFA', 'IZIN'];

// PATCH /api/attendance/[id] — verify attendance.
// MENTOR (wilayah match) or SUPERADMIN. Body: { status }.
// Setting back to MENUNGGU_KONFIRMASI is allowed (mentor "reset").
export async function PATCH(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { id } = await params;
  const attendance = await prisma.attendance.findUnique({
    where: { id },
    include: { session: true, awardee: { select: { wilayahId: true } } },
  });
  if (!attendance) return new NextResponse('Absensi tidak ditemukan', { status: 404 });

  // Mentors can only touch attendance for sessions in their own wilayah.
  // (A national session that a mentor didn't create is still verified by SUPERADMIN.)
  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    const sessionWil = attendance.session.wilayahId;
    if (!mp || !sessionWil || mp.wilayahId !== sessionWil) {
      return new NextResponse('Sesi ini tidak berada di wilayahmu', { status: 403 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const { status } = body;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: `Status tidak valid. Pilih: ${VALID.join(', ')}` }, { status: 400 });
  }

  const isReset = status === 'MENUNGGU_KONFIRMASI';
  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      status,
      verifiedAt: isReset ? null : new Date(),
      verifiedById: isReset ? null : me.id,
    },
    select: { id: true, status: true, verifiedAt: true, verifiedById: true },
  });
  return NextResponse.json(updated);
}
