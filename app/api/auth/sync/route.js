import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ambil data user dari Clerk
    const user = await currentUser();
    if (!user) {
      return new NextResponse('User not found in Clerk', { status: 404 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'Unknown';
    const avatarUrl = user.imageUrl;

    // Cek apakah user sudah ada di database Neon
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!dbUser) {
      // Jika belum ada, buat baru
      // HARDCODE: Jika email adalah teach.d3v@gmail.com, jadikan SUPERADMIN otomatis
      let defaultRole = 'UNVERIFIED';
      if (email === 'teach.d3v@gmail.com') {
        defaultRole = 'SUPERADMIN';
      }

      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          name: name,
          avatarUrl: avatarUrl,
          role: defaultRole,
          isProfileComplete: false
        }
      });
    }

    return NextResponse.json(dbUser);

  } catch (error) {
    console.error('Error syncing user:', error);
    return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
  }
}
