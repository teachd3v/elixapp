import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';
import { JOURNAL_ACTIVITIES } from '../route';

const MAX_PHOTO_BYTES = 800 * 1024;

function b64Size(s) {
  if (typeof s !== 'string' || !s.startsWith('data:')) return -1;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}

// PATCH /api/mentor/journals/[id] — update entri jurnal
export async function PATCH(request, context) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.mentorJournal.findUnique({
    where: { id },
    include: { mentor: { select: { userId: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Jurnal tidak ditemukan.' }, { status: 404 });
  }

  if (me.role === 'MENTOR' && existing.mentor?.userId !== me.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    activityName,
    qualitativeAchievement,
    quantitativeAchievement,
    activityDate,
    activityTime,
    locationType,
    locationDetail,
    problemIdentification,
    improvementPlan,
    evidenceText,
    evidencePhoto,
  } = body;

  if (!activityName || !JOURNAL_ACTIVITIES.includes(activityName)) {
    return NextResponse.json({ error: 'Pilih Nama Kegiatan yang valid dari daftar.' }, { status: 400 });
  }
  if (!qualitativeAchievement?.trim()) {
    return NextResponse.json({ error: 'Capaian Kualitatif wajib diisi.' }, { status: 400 });
  }
  if (!quantitativeAchievement?.trim()) {
    return NextResponse.json({ error: 'Capaian Kuantitatif wajib diisi.' }, { status: 400 });
  }

  const parsedDate = new Date(activityDate);
  if (!activityDate || Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Tanggal Pelaksanaan tidak valid.' }, { status: 400 });
  }

  if (!activityTime?.trim()) {
    return NextResponse.json({ error: 'Waktu Pelaksanaan (format 24 jam) wajib diisi.' }, { status: 400 });
  }

  if (!['Daring', 'Luring'].includes(locationType)) {
    return NextResponse.json({ error: 'Pilih Tempat Pelaksanaan (Daring atau Luring).' }, { status: 400 });
  }
  if (!locationDetail?.trim()) {
    return NextResponse.json({ error: 'Deskripsi Tempat Pelaksanaan wajib diisi.' }, { status: 400 });
  }

  if (!problemIdentification?.trim()) {
    return NextResponse.json({ error: 'Identifikasi Masalah wajib diisi.' }, { status: 400 });
  }
  if (!improvementPlan?.trim()) {
    return NextResponse.json({ error: 'Rencana Perbaikan wajib diisi.' }, { status: 400 });
  }

  const nextEvidenceText = evidenceText !== undefined ? (evidenceText?.trim() || null) : existing.evidenceText;
  const nextEvidencePhoto = evidencePhoto !== undefined ? (evidencePhoto || null) : existing.evidencePhoto;

  if (!nextEvidenceText && !nextEvidencePhoto) {
    return NextResponse.json(
      { error: 'Evidence wajib diisi (berupa teks keterangan/link atau unggah foto dokumentasi).' },
      { status: 400 }
    );
  }

  if (nextEvidencePhoto && evidencePhoto !== undefined) {
    const size = b64Size(nextEvidencePhoto);
    if (size < 0) {
      return NextResponse.json({ error: 'Format foto dokumentasi tidak valid.' }, { status: 400 });
    }
    if (size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Ukuran foto dokumentasi terlalu besar (>800 KB).' }, { status: 400 });
    }
  }

  const updated = await prisma.mentorJournal.update({
    where: { id },
    data: {
      activityName,
      qualitativeAchievement: qualitativeAchievement.trim(),
      quantitativeAchievement: quantitativeAchievement.trim(),
      activityDate: parsedDate,
      activityTime: activityTime.trim(),
      locationType,
      locationDetail: locationDetail.trim(),
      problemIdentification: problemIdentification.trim(),
      improvementPlan: improvementPlan.trim(),
      evidenceText: nextEvidenceText,
      evidencePhoto: nextEvidencePhoto,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/mentor/journals/[id] — hapus entri jurnal
export async function DELETE(_request, context) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.mentorJournal.findUnique({
    where: { id },
    include: { mentor: { select: { userId: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Jurnal tidak ditemukan.' }, { status: 404 });
  }

  if (me.role === 'MENTOR' && existing.mentor?.userId !== me.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  await prisma.mentorJournal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
