import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

const TARGET_ROLES = ['ALL', 'AWARDEE', 'MENTOR'];

// Feed = pengumuman yang benar-benar ditujukan ke user (untuk bell notifikasi).
// Selalu EXCLUDE pengumuman yang dibuat sendiri — orang tidak seharusnya dapat
// notifikasi dari dirinya sendiri.
// - AWARDEE   : targetRole ALL/AWARDEE + targetRegion null/wilayahnya
// - MENTOR    : targetRole ALL/MENTOR  + targetRegion null/wilayahnya
// - SUPERADMIN: targetRole ALL         + targetRegion null (nasional saja)
export async function feedWhere(me) {
  const base = { NOT: { createdById: me.id } };
  if (me.role === 'AWARDEE') {
    const ap = await prisma.awardeeProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    return {
      ...base,
      targetRole: { in: ['ALL', 'AWARDEE'] },
      OR: [{ targetRegion: null }, { targetRegion: ap?.wilayahId || '__none__' }],
    };
  }
  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    return {
      ...base,
      targetRole: { in: ['ALL', 'MENTOR'] },
      OR: [{ targetRegion: null }, { targetRegion: mp?.wilayahId || '__none__' }],
    };
  }
  if (me.role === 'SUPERADMIN') {
    return { ...base, targetRole: 'ALL', targetRegion: null };
  }
  return { id: '__none__' };
}

// Manage = list untuk tab Pengumuman (mentor/superadmin) — INCLUDE yang mereka
// bikin sendiri (biar bisa lihat riwayat & hapus). Awardee tidak seharusnya
// panggil ini.
async function manageWhere(me) {
  if (me.role === 'SUPERADMIN') return {};
  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    return {
      OR: [
        { createdById: me.id },
        {
          AND: [
            { targetRole: { in: ['ALL', 'MENTOR'] } },
            { OR: [{ targetRegion: null }, { targetRegion: mp?.wilayahId || '__none__' }] },
          ],
        },
      ],
    };
  }
  return { id: '__none__' };
}

// GET /api/announcements?scope=feed|manage — daftar pengumuman + isRead untuk user.
// scope=feed (default): notifikasi personal (exclude yang dia bikin sendiri).
// scope=manage       : dashboard mentor/superadmin (include yang dia bikin).
export async function GET(request) {
  try {
    const me = await getCurrentDbUser();
    if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') === 'manage' ? 'manage' : 'feed';
  const where = scope === 'manage' ? await manageWhere(me) : await feedWhere(me);

  const [rows, wilayahList] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, title: true, message: true,
        targetRole: true, targetRegion: true,
        createdAt: true, createdById: true,
        createdBy: { select: { name: true } },
        reads: { where: { userId: me.id }, select: { id: true }, take: 1 },
      },
    }),
    // Small lookup to resolve targetRegion → name (schema stores id-as-string, not FK).
    prisma.wilayah.findMany({ select: { id: true, name: true } }),
  ]);
  const wilayahName = Object.fromEntries(wilayahList.map((w) => [w.id, w.name]));

  return NextResponse.json(rows.map((r) => ({
    id: r.id, title: r.title, message: r.message,
    targetRole: r.targetRole, targetRegion: r.targetRegion,
    targetRegionName: r.targetRegion ? (wilayahName[r.targetRegion] || null) : null,
    createdAt: r.createdAt, createdById: r.createdById,
    createdByName: r.createdBy?.name || null,
    isRead: r.reads.length > 0,
  })));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}

// POST /api/announcements — buat pengumuman.
// MENTOR: auto target AWARDEE di wilayahnya sendiri (nggak bisa pilih lain).
// SUPERADMIN: bebas pilih targetRole + targetRegion.
// Body: { title, message, targetRole?, targetRegion? }
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });
  if (me.role !== 'MENTOR' && me.role !== 'SUPERADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title = body.title?.trim();
  const message = body.message?.trim();
  if (!title) return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Pesan wajib diisi.' }, { status: 400 });

  let targetRole, targetRegion;
  if (me.role === 'MENTOR') {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: me.id }, select: { wilayahId: true } });
    if (!mp) return NextResponse.json({ error: 'Lengkapi profil mentor dulu.' }, { status: 400 });
    targetRole = 'AWARDEE';
    targetRegion = mp.wilayahId;
  } else {
    targetRole = body.targetRole || 'ALL';
    if (!TARGET_ROLES.includes(targetRole)) {
      return NextResponse.json({ error: `targetRole tidak valid. Pilih: ${TARGET_ROLES.join(', ')}` }, { status: 400 });
    }
    targetRegion = body.targetRegion || null;
    if (targetRegion) {
      const w = await prisma.wilayah.findUnique({ where: { id: targetRegion } });
      if (!w) return NextResponse.json({ error: 'Wilayah tidak ditemukan.' }, { status: 400 });
    }
  }

  const created = await prisma.announcement.create({
    data: { title, message, targetRole, targetRegion, createdById: me.id },
    select: { id: true, title: true, message: true, targetRole: true, targetRegion: true, createdAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}
