import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    console.log('POST /api/auth/login - Login attempt started');
    
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Login validation failed - Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find user
    console.log('Looking up user in database');
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('User not found with email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User found:', { id: user.id, email: user.email });

    // Verify password
    console.log('Verifying password');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('Password verification failed for user:', user.email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Password verified successfully');

    // Set admin status for test@test.com
    if (email === 'test@test.com') {
      console.log('Setting admin status for test@test.com');
      try {
        await prisma.user.update({
          where: { email },
          data: { isAdmin: true }
        });
        user.isAdmin = true;
        console.log('Admin status updated successfully');
      } catch (err) {
        console.error('Error updating admin status:', err);
      }
    }

    // Log user sign-in activity
    try {
      const headersList = headers();
      const userAgent = headersList.get('user-agent') || '';
      const ipAddress = headersList.get('x-forwarded-for') || request.headers.get('x-forwarded-for') || '';
      
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          activityType: 'SIGN_IN',
          ipAddress: ipAddress.split(',')[0].trim(), // Get the original client IP
          userAgent
        }
      });
      console.log('User sign-in activity logged');
    } catch (err) {
      console.error('Error logging user sign-in activity:', err);
      // Continue with login process even if logging fails
    }

    // Generate JWT
    console.log('Generating JWT token');
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin
    };
    console.log('JWT payload:', { ...payload, avatarUrl: payload.avatarUrl ? '[PRESENT]' : '[NOT PRESENT]' });
    
    const token = await signJWT(payload);
    console.log('JWT token generated successfully');

    // Set cookie
    console.log('Setting authentication cookie');
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    });

    console.log('Login successful for user:', user.email);
    return NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 