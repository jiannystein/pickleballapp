import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Generate a random 10-character password
    const newPassword = crypto.randomBytes(5).toString('hex');
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Password has been reset',
      user: updatedUser,
      tempPassword: newPassword
    }));
  } catch (error) {
    console.error('Error resetting password:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 