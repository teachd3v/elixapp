import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// PUT /api/admin/monev/teaching-plans/[id] — Update Aspek atau Indikator
export async function PUT(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { type, title, score, order } = body;

  if (type === 'ASPECT') {
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Nama Aspek wajib diisi.' }, { status: 400 });
    }
    const updated = await prisma.mentorTeachingAspect.update({
      where: { id },
      data: {
        title: title.trim(),
        order: typeof order === 'number' ? order : undefined,
      },
    });
    return NextResponse.json(updated);
  }

  // Update INDICATOR
  const updateData = {};
  if (title?.trim()) updateData.title = title.trim();
  if (score != null) {
    const s = Number(score);
    if (!Number.isNaN(s) && s > 0) updateData.score = s;
  }
  if (typeof order === 'number') updateData.order = order;

  const updatedIndicator = await prisma.mentorTeachingIndicator.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updatedIndicator);
}

// DELETE /api/admin/monev/teaching-plans/[id] — Hapus Aspek atau Indikator
export async function DELETE(request, { params }) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'INDICATOR';

  if (type === 'ASPECT') {
    await prisma.mentorTeachingAspect.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Aspek berhasil dihapus.' });
  }

  await prisma.mentorTeachingIndicator.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Indikator berhasil dihapus.' });
}
