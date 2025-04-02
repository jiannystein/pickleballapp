import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { isSessionEnded } from '@/lib/dateUtils';
import { initializeSessionReviews } from '@/lib/reviews';

// POST - Auto-update statuses of past sessions that aren't cancelled
export async function POST(request: NextRequest) {
  try {
    // Get the user - not required but used for logging
    const user = await getUser(request);
    
    console.log('Checking for sessions that have ended to update to completed status...');
    
    // Find all sessions that haven't been marked as completed or cancelled
    const activeSessions = await prisma.session.findMany({
      where: {
        status: {
          notIn: ['completed', 'cancelled']
        }
      },
      include: {
        participants: true
      }
    });

    const now = new Date();
    let updatedCount = 0;

    for (const session of activeSessions) {
      if (isSessionEnded(session)) {
        await prisma.session.update({
          where: { id: session.id },
          data: { status: 'completed' }
        });
        
        // Initialize reviews for this session
        console.log(`Initializing reviews for auto-completed session: ${session.id}`);
        await initializeSessionReviews(session.id);
        
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} sessions to completed status`);

    return NextResponse.json({ 
      message: `Successfully updated ${updatedCount} sessions to completed status`,
      updatedCount: updatedCount
    });
    
  } catch (error) {
    console.error('Error in session status update:', error);
    return NextResponse.json(
      { error: 'Failed to update session statuses' },
      { status: 500 }
    );
  }
} 