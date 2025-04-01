import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-replace-this-in-production'
);

interface UserJWTPayload {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
  [key: string]: unknown;
}

export async function signJWT(payload: UserJWTPayload) {
  const token = await new SignJWT({
    ...payload,
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
    isAdmin: payload.isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  
  return token;
}

export async function verifyJWT(token: string): Promise<UserJWTPayload | null> {
  try {
    console.log('Verifying JWT token');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('JWT payload:', payload);
    
    const userPayload = payload as unknown as UserJWTPayload;
    if (!userPayload.userId || !userPayload.email || !userPayload.name || typeof userPayload.isAdmin !== 'boolean') {
      console.log('Invalid JWT payload structure:', userPayload);
      return null;
    }
    return userPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function getUser(req: NextRequest): Promise<UserJWTPayload | null> {
  try {
    // Get token from request cookies directly
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      console.log('No token found in request cookies');
      return null;
    }
    
    console.log('Token found, verifying...');
    const payload = await verifyJWT(token);
    
    if (!payload) {
      console.log('Token verification failed');
      return null;
    }
    
    console.log('User authenticated:', payload.email);
    return payload;
  } catch (error) {
    console.error('Error in getUser function:', error);
    return null;
  }
}

export async function verifyAuth(): Promise<UserJWTPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      console.log('No token found in cookies');
      return null;
    }
    
    const payload = await verifyJWT(token);
    
    if (!payload) {
      console.log('Token verification failed');
      return null;
    }
    
    console.log('User authenticated:', payload.email);
    
    // Check if user exists in database with this ID
    try {
      const userCheck = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true }
      });
      
      if (!userCheck) {
        console.log(`Warning: Token has valid userId ${payload.userId} but user does not exist in database`);
      } else if (userCheck.email !== payload.email) {
        console.log(`Warning: Token email (${payload.email}) doesn't match database email (${userCheck.email})`);
      }
    } catch (dbError) {
      console.error('Error checking user in database:', dbError);
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return null;
  }
} 