import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { notifySessionCancellation } from '@/lib/notifications';
import { logUserActivity, ActivityType } from '@/lib/activity';

// PATCH - Cancel a session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    console.log(`Attempting to cancel session: ${sessionId}`);
    
    // Debug cookies
    const token = request.cookies.get('token')?.value;
    console.log('Auth token present:', !!token);
    
    const user = await getUser(request);
    console.log('User from auth:', user ? `ID: ${user.userId}, Name: ${user.name}` : 'No user found');

    if (!user) {
      console.log('Unauthorized - No user found in request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session exists and user is the creator
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        players: {
          select: {
            id: true,
          }
        }
      }
    });

    if (!existingSession) {
      console.log('Session not found:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log(`Session creator: ${existingSession.creator.id} (${existingSession.creator.name})`);
    console.log(`Current user: ${user.userId} (${user.name})`);

    if (existingSession.creator.id !== user.userId) {
      console.log('Unauthorized: Creator ID does not match user ID');
      console.log(`Creator ID: ${existingSession.creator.id}`);
      console.log(`User ID: ${user.userId}`);
      return NextResponse.json({ error: 'Unauthorized: Only the creator can cancel this session' }, { status: 403 });
    }

    // Update the session status to cancelled
    const cancelledSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'cancelled'
      }
    });

    // Log the cancel session activity for the host
    await logUserActivity(user.userId, ActivityType.CANCEL_SESSION, request);

    // Get player IDs and notify all participants about the cancellation
    const playerIds = existingSession.players.map(player => player.id);
    if (playerIds.length > 0) {
      console.log(`Notifying ${playerIds.length} participants about session cancellation`);
      
      // Log SESSION_CANCELLED_BY_HOST activity for each participant
      for (const playerId of playerIds) {
        await logUserActivity(
          playerId, 
          ActivityType.SESSION_CANCELLED_BY_HOST,
          request,
          // We don't have access to participant's IP/UserAgent, so using those from the host
          request.headers.get('x-forwarded-for') || '',
          request.headers.get('user-agent') || ''
        );
      }
      
      await notifySessionCancellation(
        playerIds,
        user.name,
        sessionId,
        existingSession.title
      );
    }

    console.log('Session cancelled successfully:', sessionId);
    return NextResponse.json({ success: true, message: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling session:', error);
    return NextResponse.json(
      { error: 'An error occurred while cancelling the session' },
      { status: 500 }
    );
  }
} 