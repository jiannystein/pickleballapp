import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { notifyUserOfJoinRequestApproval } from '@/lib/notifications';
import { logUserActivity, ActivityType } from '@/lib/activity';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, requestId: string } }
) {
  try {
    const user = await getUser(request);
    
    if (!user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: sessionId, requestId } = params;
    const { status } = await request.json();

    // Validate status
    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json(
        { error: 'Invalid status. Must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Check if session exists and user is the creator
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        creatorId: true,
        title: true,
        maxPlayers: true,
        players: {
          select: { id: true }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is the session creator
    if (session.creatorId !== user.userId) {
      return NextResponse.json(
        { error: 'Only the session host can approve or reject join requests' },
        { status: 403 }
      );
    }

    // Find the join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { 
        id: requestId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!joinRequest || joinRequest.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Check if request is already processed
    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${joinRequest.status}` },
        { status: 400 }
      );
    }

    // If approving, check if session is full
    if (status === 'approved' && session.players.length >= session.maxPlayers) {
      return NextResponse.json(
        { error: 'Cannot approve request because the session is now full' },
        { status: 400 }
      );
    }

    // Update the request status
    const updatedRequest = await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        session: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Log the activity based on the status
    if (status === 'approved') {
      await logUserActivity(user.userId, ActivityType.APPROVE_JOIN_REQUEST, request);
      
      // Also add the user to the session
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          players: {
            connect: { id: joinRequest.userId }
          }
        }
      });

      // Send notification to user that their request was approved
      await notifyUserOfJoinRequestApproval(
        joinRequest.userId,
        user.name,
        sessionId,
        session.title
      );
    } else {
      await logUserActivity(user.userId, ActivityType.REJECT_JOIN_REQUEST, request);
    }

    return NextResponse.json({
      message: `Join request ${status}`,
      request: updatedRequest
    });
  } catch (error) {
    console.error(`Error ${params?.requestId ? 'processing join request' : 'with request parameters'}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 