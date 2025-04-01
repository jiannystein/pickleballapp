import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { notifyHostOfSessionJoin, notifyHostOfJoinRequest } from '@/lib/notifications';
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

    // Get request body for optional message
    const body = await request.json().catch(() => ({}));
    const { message } = body;

    const sessionId = params.id;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        joinRequests: {
          where: {
            userId: user.userId
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is already in the session
    if (session.players.some((player) => player.id === user.userId)) {
      return NextResponse.json(
        { error: 'Already joined this session' },
        { status: 400 }
      );
    }

    // Check if user has already sent a join request for this private session
    if (session.isPrivate && session.joinRequests.length > 0) {
      const existingRequest = session.joinRequests[0];
      
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { 
            error: 'Join request already pending', 
            requestId: existingRequest.id,
            status: existingRequest.status
          },
          { status: 400 }
        );
      } else if (existingRequest.status === 'rejected') {
        return NextResponse.json(
          { 
            error: 'Your previous request to join this session was declined', 
            requestId: existingRequest.id,
            status: existingRequest.status
          },
          { status: 403 }
        );
      }
    }

    // Check if session is full
    if (session.players.length >= session.maxPlayers) {
      return NextResponse.json(
        { error: 'Session is full' },
        { status: 400 }
      );
    }

    // Handle private sessions
    if (session.isPrivate) {
      // Create a join request
      const joinRequest = await prisma.joinRequest.create({
        data: {
          userId: user.userId,
          sessionId: sessionId,
          status: 'pending',
          message: message || null
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
          session: {
            select: {
              title: true,
              creator: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });

      // Log the join request activity
      await logUserActivity(user.userId, ActivityType.REQUEST_JOIN_SESSION, request);

      // Send notification to host about the join request
      await notifyHostOfJoinRequest(
        session.creator.id,
        user.userId,
        user.name,
        sessionId,
        session.title
      );

      return NextResponse.json({
        message: 'Join request sent to the host. You will be notified when it is approved.',
        requestId: joinRequest.id,
        status: 'pending'
      });
    }

    // For public sessions, join immediately
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        players: {
          connect: { id: user.userId }
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

    // Log the join session activity
    await logUserActivity(user.userId, ActivityType.JOIN_SESSION, request);

    // Send notification to host about the new participant
    await notifyHostOfSessionJoin(
      session.creator.id,
      user.userId,
      user.name,
      sessionId,
      session.title
    );

    return NextResponse.json({
      message: 'Successfully joined the session',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 