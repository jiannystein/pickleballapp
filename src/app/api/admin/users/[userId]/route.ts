import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function PATCH(
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

    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== 'boolean') {
      return new NextResponse(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { isAdmin },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    });

    return new NextResponse(JSON.stringify(updatedUser));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }
    console.error('Error updating user:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function DELETE(
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

    // Check if user is trying to delete themselves
    if (user.id === params.userId) {
      return new NextResponse(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
      });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: params.userId },
    });

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }
    console.error('Error deleting user:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 