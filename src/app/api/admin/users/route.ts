import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/users - Admin user request received');
    
    const user = await getUser(request);
    console.log('Current user:', user ? `ID: ${user.userId}, Admin: ${user.isAdmin}` : 'Not authenticated');
    
    if (!user?.isAdmin) {
      console.log('User is not an admin, returning unauthorized');
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // First, check if users exist in the database at all
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    // Check specifically for the current user
    const currentUserCheck = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    console.log(`Current user exists in DB: ${!!currentUserCheck}`);
    
    console.log('Fetching all users from database');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    });
    console.log(`Found ${users.length} users`);
    
    // Log the first few users for debugging
    if (users.length > 0) {
      console.log('Sample users:', users.slice(0, 3));
    }

    return new NextResponse(JSON.stringify(users));
  } catch (error) {
    console.error('Error in admin users route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 