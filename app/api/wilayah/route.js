import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUser } from '@/lib/auth';

// GET /api/wilayah — list program coaching regions for the profile form.
// Any signed-in user may read this.
export async function GET() {
  const me = await getCurrentDbUser();
  if (!me) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const wilayah = await prisma.wilayah.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return NextResponse.json(wilayah);
}
