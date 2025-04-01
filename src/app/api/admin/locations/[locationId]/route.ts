import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Delete the location
    await prisma.location.delete({
      where: { id: params.locationId },
    });

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
      });
    }
    console.error('Error deleting location:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 