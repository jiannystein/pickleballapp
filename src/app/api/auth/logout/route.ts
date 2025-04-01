import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    console.log('POST /api/auth/logout - Logging out user');
    // Clear the authentication cookie
    cookies().delete('token');
    
    // Return redirect response instead of JSON
    return NextResponse.redirect(new URL('/', 'http://localhost:3000'));
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 