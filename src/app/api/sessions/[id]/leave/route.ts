import { NextResponse, NextRequest } from 'next/server';
import { User } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { logUserActivity, ActivityType } from '@/lib/activity';

export async function POST(
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
      include: {
        players: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is in the session
    if (!session.players.some((player: User) => player.id === user.userId)) {
      return NextResponse.json(
        { error: 'Not joined this session' },
        { status: 400 }
      );
    }

    // Check if user is the creator (creators cannot leave their own sessions)
    if (session.creatorId === user.userId) {
      return NextResponse.json(
        { error: 'Session creator cannot leave their own session' },
        { status: 400 }
      );
    }

    // Leave session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        players: {
          disconnect: { id: user.userId }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        players: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log the leave session activity
    await logUserActivity(user.userId, ActivityType.LEAVE_SESSION, request);

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error leaving session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
