import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/profile — the current user's role-specific profile (or null).
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (me.role === 'AWARDEE') {
    const profile = await prisma.awardeeProfile.findUnique({
      where: { userId: me.id },
      include: { wilayah: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ user: publicUser(me), profile });
  }

  if (me.role === 'MENTOR') {
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId: me.id },
      include: { wilayah: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ user: publicUser(me), profile });
  }

  return NextResponse.json({ user: publicUser(me), profile: null });
}

// POST /api/profile — create/update the current user's profile and mark it
// complete. Only AWARDEE and MENTOR have profiles.
export async function POST(request) {
  const me = await getCurrentDbUser();
  if (!me) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (me.role !== 'AWARDEE' && me.role !== 'MENTOR') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { wilayahId, name, phone } = body;

  if (!wilayahId) {
    return NextResponse.json({ error: 'Wilayah wajib dipilih.' }, { status: 400 });
  }

  // Ensure the region exists.
  const wilayah = await prisma.wilayah.findUnique({ where: { id: wilayahId } });
  if (!wilayah) {
    return NextResponse.json({ error: 'Wilayah tidak ditemukan.' }, { status: 400 });
  }

  try {
    if (me.role === 'AWARDEE') {
      const data = {
        wilayahId,
        school: body.school || null,
        major: body.major || null,
        generation: body.generation || null,
        gpa: parseNumber(body.gpa),
        gender: body.gender || null,
        birthInfo: body.birthInfo || null,
        address: body.address || null,
        ktp: body.ktp || null,
        kk: body.kk || null,
        province: body.province || null,
        city: body.city || null,
      };
      await prisma.awardeeProfile.upsert({
        where: { userId: me.id },
        create: { userId: me.id, ...data },
        update: data,
      });
    } else {
      // MENTOR — profile is just the assigned region for now.
      await prisma.mentorProfile.upsert({
        where: { userId: me.id },
        create: { userId: me.id, wilayahId },
        update: { wilayahId },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: me.id },
      data: {
        name: name?.trim() || me.name,
        phone: phone || null,
        isProfileComplete: true,
      },
    });

    return NextResponse.json({ ok: true, user: publicUser(updatedUser) });
  } catch (error) {
    // A MentorProfile's wilayah is unique (one mentor per region).
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Wilayah ini sudah memiliki mentor. Pilih wilayah lain.' },
        { status: 409 }
      );
    }
    console.error('Error saving profile:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    isProfileComplete: u.isProfileComplete,
  };
}
