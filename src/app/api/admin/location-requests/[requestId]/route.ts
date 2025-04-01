import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== 'approved' && status !== 'rejected') {
      return new NextResponse(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
      });
    }

    const locationRequest = await prisma.locationRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!locationRequest) {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }

    // Handle the status update and location creation in a transaction
    if (status === 'approved') {
      await prisma.$transaction([
        prisma.locationRequest.update({
          where: { id: params.requestId },
          data: { status },
        }),
        prisma.location.create({
          data: {
            name: locationRequest.name,
            address: locationRequest.address,
            instructions: locationRequest.instructions,
            isApproved: true,
          },
        }),
      ]);
    } else {
      await prisma.locationRequest.update({
        where: { id: params.requestId },
        data: { status },
      });
    }

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }
    console.error('Error updating location request:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const user = await getUser(request);
    if (!user?.isAdmin) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Delete the location request
    await prisma.locationRequest.delete({
      where: { id: params.requestId },
    });

    return new NextResponse(JSON.stringify({ success: true }));
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return new NextResponse(JSON.stringify({ error: 'Location request not found' }), {
        status: 404,
      });
    }
    console.error('Error deleting location request:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 