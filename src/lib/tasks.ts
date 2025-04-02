import cron from 'node-cron';
import prisma from '@/lib/prisma';
import { initializeSessionReviews } from '@/lib/reviews';

/**
 * Task to initialize pending review states for all completed sessions that don't have them
 */
async function initializePendingReviews() {
  try {
    console.log('Running scheduled task: Initialize pending reviews');
    
    // 1. Find all completed sessions
    const completedSessions = await prisma.session.findMany({
      where: { status: 'completed' },
      select: { id: true }
    });
    
    console.log(`Found ${completedSessions.length} completed sessions to check for initialization`);
    
    if (completedSessions.length === 0) {
      console.log('No completed sessions to process');
      return;
    }
    
    // 2. For each session, check if it has PendingReviewState records
    let processedCount = 0;
    
    for (const session of completedSessions) {
      // Check if this session already has PendingReviewState records
      const existingStates = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM "PendingReviewState" WHERE "sessionId" = ${session.id}
      `;
      
      const hasExistingStates = existingStates[0]?.count > 0;
      
      // If no records exist, initialize this session
      if (!hasExistingStates) {
        console.log(`Initializing PendingReviewState for session: ${session.id}`);
        await initializeSessionReviews(session.id);
        processedCount++;
      }
    }
    
    console.log(`Task completed: Initialized review states for ${processedCount} sessions`);
  } catch (error: any) {
    console.error('Error in initializePendingReviews task:', error.message);
  }
}

/**
 * Schedule and start all tasks
 */
export function startScheduledTasks() {
  // Schedule the pending reviews initialization to run every 5 minutes
  const reviewsTask = cron.schedule('*/5 * * * *', async () => {
    await initializePendingReviews();
  });
  
  console.log('Scheduled tasks started');
  
  // Return the task instances so they can be stopped if needed
  return {
    reviewsTask
  };
} 