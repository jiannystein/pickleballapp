import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { initializeSessionReviews } from '@/lib/reviews';

/**
 * POST /api/tasks/initialize-reviews
 * Manually triggers initialization of PendingReviewState for all completed sessions
 * Requires admin privileges
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and require admin
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an admin
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true }
    });
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }
    
    // Find all completed sessions
    const completedSessions = await prisma.session.findMany({
      where: { status: 'completed' },
      select: { id: true, title: true }
    });
    
    console.log(`Found ${completedSessions.length} completed sessions to initialize`);
    
    if (completedSessions.length === 0) {
      return NextResponse.json({ 
        message: 'No completed sessions found to initialize',
        sessionsProcessed: 0
      });
    }
    
    // Initialize pending reviews for each session
    const results = [];
    for (const session of completedSessions) {
      console.log(`Initializing reviews for session: ${session.id} (${session.title})`);
      
      try {
        const success = await initializeSessionReviews(session.id);
        results.push({
          sessionId: session.id,
          title: session.title,
          success
        });
      } catch (err: any) {
        results.push({
          sessionId: session.id,
          title: session.title,
          success: false,
          error: err.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      message: `Successfully initialized ${successCount} of ${completedSessions.length} sessions`,
      sessionsProcessed: completedSessions.length,
      successCount,
      results
    });
    
  } catch (error: any) {
    console.error('Error in manual review initialization:', error);
    return NextResponse.json(
      { error: 'Failed to initialize reviews', message: error.message },
      { status: 500 }
    );
  }
} 