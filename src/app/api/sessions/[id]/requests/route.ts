import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);
    
    if (!user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionId = params.id;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        creatorId: true,
        title: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Ensure the user is the session creator
    if (session.creatorId !== user.userId) {
      return NextResponse.json(
        { error: 'Only the session host can view join requests' },
        { status: 403 }
      );
    }

    // Get pending join requests
    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        sessionId: params.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(joinRequests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 