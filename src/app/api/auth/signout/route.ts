import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    console.log('POST /api/auth/signout - Logging out user');
    // Clear the authentication cookie
    cookies().delete('token');
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 