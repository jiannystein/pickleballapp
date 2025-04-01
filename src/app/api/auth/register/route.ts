import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Log the start of the request
    console.log('Starting registration process');

    const body = await request.json();
    console.log('Received registration data:', { ...body, password: '[REDACTED]' });

    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      console.log('Missing required fields:', { email: !!email, password: !!password, name: !!name });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists with email:', email);
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log('Creating new user');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isAdmin: false // Default to non-admin
      }
    });

    // Log user sign-up activity
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const ipAddress = headersList.get('x-forwarded-for') || request.headers.get('x-forwarded-for') || '';
    
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: 'SIGN_UP',
        ipAddress: ipAddress.split(',')[0].trim(), // Get the original client IP
        userAgent
      }
    });
    
    console.log('User sign-up activity logged');

    // Generate JWT
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    });

    // Set cookie
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    });

    console.log('User created successfully:', { userId: user.id });
    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        }
      },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check if it's a Prisma error
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Registration failed: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
} 