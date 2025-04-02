import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { notifySessionCompletion } from '@/lib/notifications';
import { logUserActivity, ActivityType } from '@/lib/activity';
import { initializeSessionReviews } from '@/lib/reviews';

// PATCH - Mark a session as completed
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    console.log(`Attempting to mark session as completed: ${sessionId}`);
    
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
      return NextResponse.json({ error: 'Unauthorized: Only the creator can mark this session as completed' }, { status: 403 });
    }

    // Check if the session is already completed or cancelled
    if (existingSession.status === 'completed') {
      return NextResponse.json({ error: 'This session is already marked as completed' }, { status: 400 });
    }
    
    if (existingSession.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot mark a cancelled session as completed' }, { status: 400 });
    }

    // Update the session status to completed
    const completedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed'
      }
    });

    // Initialize pending reviews for all participants
    console.log(`Session ${sessionId} marked as completed, initializing reviews for all participants...`);
    await initializeSessionReviews(sessionId);

    // Log the complete session activity
    await logUserActivity(user.userId, ActivityType.COMPLETE_SESSION, request);

    // Get all participant IDs (including the creator)
    const allParticipantIds = [
      ...existingSession.players.map(player => player.id),
      existingSession.creator.id // Include the creator as well
    ];
    
    // Filter out duplicates (in case the creator is also in players list)
    const uniqueParticipantIds = [...Array.from(new Set(allParticipantIds))];

    // Notify all participants about the session completion
    if (uniqueParticipantIds.length > 0) {
      console.log(`Notifying ${uniqueParticipantIds.length} participants about session completion`);
      await notifySessionCompletion(
        uniqueParticipantIds,
        sessionId,
        existingSession.title
      );
    }

    console.log('Session marked as completed successfully:', sessionId);
    return NextResponse.json({ 
      success: true, 
      message: 'Session marked as completed successfully',
      session: completedSession
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'An error occurred while marking the session as completed' },
      { status: 500 }
    );
  }
} 