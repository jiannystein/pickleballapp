import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { logUserActivity, ActivityType } from '@/lib/activity';

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

    // Find the user's join request for this session
    const joinRequest = await (prisma as any).joinRequest.findUnique({
      where: {
        userId_sessionId: {
          userId: user.userId,
          sessionId: sessionId
        }
      }
    });

    if (!joinRequest) {
      return NextResponse.json(null);
    }

    // Check if the session has expired
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { date: true }
    });

    // If session is in the past, we should indicate this
    const isExpired = session && new Date(session.date) < new Date();
    
    // If session is expired, return the request with a special flag
    if (isExpired) {
      return NextResponse.json({
        ...joinRequest,
        isExpired: true
      });
    }

    return NextResponse.json(joinRequest);
  } catch (error) {
    console.error('Error fetching user join request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    console.log(`Attempting to cancel join request for session ${sessionId} by user ${user.userId}`);

    // Find the user's join request for this session
    const joinRequest = await (prisma as any).joinRequest.findUnique({
      where: {
        userId_sessionId: {
          userId: user.userId,
          sessionId: sessionId
        }
      },
      include: {
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

    if (!joinRequest) {
      console.log(`No join request found for session ${sessionId} and user ${user.userId}`);
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Only pending requests can be canceled
    if (joinRequest.status !== 'pending') {
      console.log(`Join request found but status is ${joinRequest.status}, not pending`);
      return NextResponse.json(
        { error: 'Only pending requests can be canceled' },
        { status: 400 }
      );
    }

    try {
      console.log(`Deleting join request ID ${joinRequest.id} for session ${sessionId} from user ${user.userId}`);
      
      // Delete the join request
      await (prisma as any).joinRequest.delete({
        where: {
          id: joinRequest.id
        }
      });
      
      // Log the join request cancellation activity
      await logUserActivity(user.userId, ActivityType.LEAVE_SESSION, request);
      
      console.log(`Join request deleted successfully`);
    } catch (deleteError) {
      console.error('Error deleting join request:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete join request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Join request canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling join request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 