import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/auth/me - Retrieving user information');
    
    const token = request.cookies.get('token')?.value;
    console.log('Token present:', !!token);
    
    const user = await getUser(request);
    console.log('User retrieved:', user ? `User ID: ${user.userId}` : 'No user found');
    
    if (!user) {
      console.log('GET /api/auth/me - Unauthorized: No valid user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 