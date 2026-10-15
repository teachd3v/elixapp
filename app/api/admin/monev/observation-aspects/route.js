import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/admin/monev/observation-aspects — Ambil semua aspek & indikator observasi wilayah
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  try {
    const aspects = await prisma.wilayahObservationAspect.findMany({
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
      include: {
        indicators: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(aspects);
  } catch (error) {
    console.error('Error fetching observation aspects:', error);
    return NextResponse.json({ error: 'Gagal memuat aspek observasi wilayah.' }, { status: 500 });
  }
}

// POST /api/admin/monev/observation-aspects — Tambah Aspek atau Indikator baru
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { type, section, title, description, aspectId, guideNotes } = body;

  try {
    if (type === 'ASPECT') {
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Judul aspek wajib diisi.' }, { status: 400 });
      }

      const sec = section === 'SECTION_B' ? 'SECTION_B' : 'SECTION_A';
      const count = await prisma.wilayahObservationAspect.count({
        where: { section: sec },
      });

      const newAspect = await prisma.wilayahObservationAspect.create({
        data: {
          section: sec,
          title: title.trim(),
          description: description?.trim() || null,
          order: count + 1,
        },
        include: { indicators: true },
      });

      return NextResponse.json(newAspect, { status: 201 });
    }

    if (type === 'INDICATOR') {
      if (!aspectId) {
        return NextResponse.json({ error: 'Aspek wajib dipilih.' }, { status: 400 });
      }
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Judul indikator / poin panduan wajib diisi.' }, { status: 400 });
      }

      const count = await prisma.wilayahObservationIndicator.count({
        where: { aspectId },
      });

      const newIndicator = await prisma.wilayahObservationIndicator.create({
        data: {
          aspectId,
          title: title.trim(),
          guideNotes: guideNotes?.trim() || null,
          order: count + 1,
        },
      });

      return NextResponse.json(newIndicator, { status: 201 });
    }

    return NextResponse.json({ error: 'Tipe request tidak valid (pilih ASPECT atau INDICATOR).' }, { status: 400 });
  } catch (error) {
    console.error('Error creating observation aspect/indicator:', error);
    return NextResponse.json({ error: 'Gagal menyimpan butir observasi wilayah.' }, { status: 500 });
  }
}

// PUT /api/admin/monev/observation-aspects — Edit Aspek atau Indikator
export async function PUT(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { type, id, section, title, description, guideNotes } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID wajib disertakan.' }, { status: 400 });
  }

  try {
    if (type === 'ASPECT') {
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Judul aspek wajib diisi.' }, { status: 400 });
      }

      const updated = await prisma.wilayahObservationAspect.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          ...(section ? { section: section === 'SECTION_B' ? 'SECTION_B' : 'SECTION_A' } : {}),
        },
        include: { indicators: true },
      });

      return NextResponse.json(updated);
    }

    if (type === 'INDICATOR') {
      if (!title?.trim()) {
        return NextResponse.json({ error: 'Judul indikator / poin panduan wajib diisi.' }, { status: 400 });
      }

      const updated = await prisma.wilayahObservationIndicator.update({
        where: { id },
        data: {
          title: title.trim(),
          guideNotes: guideNotes !== undefined ? (guideNotes?.trim() || null) : undefined,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Tipe request tidak valid (pilih ASPECT atau INDICATOR).' }, { status: 400 });
  } catch (error) {
    console.error('Error updating observation aspect/indicator:', error);
    return NextResponse.json({ error: 'Gagal memperbarui butir observasi wilayah.' }, { status: 500 });
  }
}

// DELETE /api/admin/monev/observation-aspects?type=aspect&id=xxx or ?type=indicator&id=xxx
export async function DELETE(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'SUPERADMIN') return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID wajib disertakan.' }, { status: 400 });
  }

  try {
    if (type === 'aspect') {
      await prisma.wilayahObservationAspect.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Aspek berhasil dihapus.' });
    }
    if (type === 'indicator') {
      await prisma.wilayahObservationIndicator.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Indikator berhasil dihapus.' });
    }

    return NextResponse.json({ error: 'Tipe tidak valid.' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting observation item:', error);
    return NextResponse.json({ error: 'Gagal menghapus butir observasi wilayah.' }, { status: 500 });
  }
}
