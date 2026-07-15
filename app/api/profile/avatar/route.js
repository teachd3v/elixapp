import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// Avatar dikompres di client (~200 KB pasca-JPEG), tapi tetap kita batasi
// di server sebagai defense in depth.
const MAX_AVATAR_BYTES = 300 * 1024;
function b64Size(s) {
  if (typeof s !== 'string' || !s.startsWith('data:')) return -1;
  const b64 = s.split(',')[1] || '';
  return Math.floor((b64.length * 3) / 4);
}

// POST /api/profile/avatar — set/replace user's avatar.
// Body: { avatarUrl: <base64 data URL> | null }.
// Menyimpan langsung ke User.avatarUrl — yang lama otomatis ter-overwrite.
// Kirim null untuk kembali ke default (avatar hilang, fallback icon di UI).
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json().catch(() => ({}));
  const raw = body.avatarUrl;

  let toSave = null;
  if (raw !== null && raw !== undefined && raw !== '') {
    const size = b64Size(raw);
    if (size < 0) return NextResponse.json({ error: 'Foto avatar tidak valid.' }, { status: 400 });
    if (size > MAX_AVATAR_BYTES) return NextResponse.json({ error: 'Foto avatar terlalu besar (>300 KB).' }, { status: 400 });
    toSave = raw;
  }

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: { avatarUrl: toSave },
    select: {
      id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, isProfileComplete: true,
    },
  });
  return NextResponse.json({ user: updated });
}
