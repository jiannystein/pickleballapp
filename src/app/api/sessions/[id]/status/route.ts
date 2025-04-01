import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// PATCH - Update session status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    console.log(`Attempting to update status for session: ${sessionId}`);
    
    const user = await getUser(request);
    console.log('User from auth:', user ? `ID: ${user.userId}, Name: ${user.name}` : 'No user found');

    if (!user) {
      console.log('Unauthorized - No user found in request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body to get the new status
    const { status } = await request.json();
    console.log(`Requested status update: ${status}`);

    if (!status || !['active', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, cancelled, completed' },
        { status: 400 }
      );
    }

    // Verify session exists and user is the creator or an admin
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!existingSession) {
      console.log('Session not found:', sessionId);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log(`Session creator: ${existingSession.creator.id} (${existingSession.creator.name})`);
    console.log(`Current user: ${user.userId} (${user.name})`);

    // Allow automatic completion of past sessions
    const isAutoComplete = status === 'completed' && 
                           new Date(existingSession.date) < new Date() && 
                           existingSession.status !== 'cancelled';
    
    // Only the creator can update the session status (with exception for auto-completion)
    if (existingSession.creator.id !== user.userId && !isAutoComplete) {
      console.log('Unauthorized: Creator ID does not match user ID');
      return NextResponse.json(
        { error: 'Unauthorized: Only the creator can update this session status' }, 
        { status: 403 }
      );
    }

    // Update the session status
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status }
    });

    console.log('Session status updated successfully:', sessionId, status);
    return NextResponse.json({ 
      success: true, 
      message: `Session status updated to ${status} successfully`,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the session status' },
      { status: 500 }
    );
  }
} 