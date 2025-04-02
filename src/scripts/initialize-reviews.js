// Initialize Review States for Completed Sessions
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeSessionReviews(sessionId) {
  try {
    console.log(`Initializing reviews for session: ${sessionId}`);
    
    // 1. Get all session participants (creator + players)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        players: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!session) {
      console.error(`Cannot initialize reviews: Session ${sessionId} not found`);
      return false;
    }

    console.log(`Found session: ${session.title} (${session.id}), Status: ${session.status}`);

    // Verify the session is completed
    if (session.status !== 'completed') {
      console.log(`Session ${sessionId} is not completed, skipping review initialization`);
      return false;
    }

    // 2. Get all participants (including creator)
    const participants = [
      { id: session.creator.id, name: session.creator.name },
      ...session.players.map(player => ({ id: player.id, name: player.name }))
    ];

    // Remove duplicate participants (in case creator is also in players)
    const uniqueParticipants = participants.filter(
      (participant, index, self) => 
        self.findIndex(p => p.id === participant.id) === index
    );

    console.log(`Processing ${uniqueParticipants.length} participants for session ${sessionId}`);
    console.log(`Participants: ${uniqueParticipants.map(p => p.name).join(', ')}`);

    // 3. For each participant, determine which other participants they need to review
    const pendingReviewsData = [];

    for (const reviewer of uniqueParticipants) {
      // Get all other participants that this user should review
      const reviewees = uniqueParticipants.filter(p => p.id !== reviewer.id);
      
      // Check for existing reviews by this reviewer
      const existingReviews = await prisma.review.findMany({
        where: {
          sessionId,
          reviewerId: reviewer.id
        },
        select: {
          revieweeId: true
        }
      });

      // Create a set of already reviewed players
      const reviewedIds = new Set(existingReviews.map(review => review.revieweeId));

      // Filter for players that still need reviews
      const pendingReviewIds = reviewees
        .filter(reviewee => !reviewedIds.has(reviewee.id))
        .map(reviewee => reviewee.id);

      console.log(`User ${reviewer.name} has ${pendingReviewIds.length} players to review`);

      // Generate a unique ID for the pending review state
      const stateId = `pk_${sessionId}_${reviewer.id}`;

      // If there are pending reviews, store them
      if (pendingReviewIds.length > 0) {
        pendingReviewsData.push({
          id: stateId,
          sessionId,
          userId: reviewer.id,
          pendingReviewCount: pendingReviewIds.length,
          hasUnreviewedPlayers: true,
          reviewedAllPlayers: false,
          lastUpdated: new Date()
        });
      } else {
        // No pending reviews - user has reviewed everyone or has no one to review
        pendingReviewsData.push({
          id: stateId,
          sessionId,
          userId: reviewer.id,
          pendingReviewCount: 0,
          hasUnreviewedPlayers: false,
          reviewedAllPlayers: true,
          lastUpdated: new Date()
        });
      }
    }

    // 4. Create or update PendingReviewState records using raw SQL to handle unique constraint issues
    for (const reviewData of pendingReviewsData) {
      try {
        // First check if there's an existing record
        const existingState = await prisma.pendingReviewState.findFirst({
          where: {
            sessionId: reviewData.sessionId,
            userId: reviewData.userId
          }
        });
        
        if (existingState) {
          // Update existing record
          console.log(`Updating existing review state for user ${reviewData.userId}`);
          await prisma.pendingReviewState.update({
            where: { id: existingState.id },
            data: {
              pendingReviewCount: reviewData.pendingReviewCount,
              hasUnreviewedPlayers: reviewData.hasUnreviewedPlayers,
              reviewedAllPlayers: reviewData.reviewedAllPlayers,
              lastUpdated: reviewData.lastUpdated
            }
          });
        } else {
          // Create new record
          console.log(`Creating new review state for user ${reviewData.userId}`);
          await prisma.pendingReviewState.create({
            data: {
              id: reviewData.id,
              sessionId: reviewData.sessionId,
              userId: reviewData.userId,
              pendingReviewCount: reviewData.pendingReviewCount,
              hasUnreviewedPlayers: reviewData.hasUnreviewedPlayers,
              reviewedAllPlayers: reviewData.reviewedAllPlayers,
              lastUpdated: reviewData.lastUpdated
            }
          });
        }
      } catch (error) {
        console.error(`Error updating review state for ${reviewData.sessionId}, user ${reviewData.userId}:`, error.message);
      }
    }

    console.log(`Successfully initialized review state for session ${sessionId}`);
    return true;
  } catch (error) {
    console.error(`Error initializing session reviews for ${sessionId}:`, error.message);
    return false;
  }
}

async function initializeAllCompletedSessions() {
  try {
    // Find all completed sessions
    const completedSessions = await prisma.session.findMany({
      where: {
        status: 'completed'
      },
      select: {
        id: true,
        title: true
      }
    });

    console.log(`Found ${completedSessions.length} completed sessions`);

    if (completedSessions.length === 0) {
      // Check if there are any sessions that need to be marked as completed
      const now = new Date();
      const pastSessions = await prisma.session.findMany({
        where: {
          date: {
            lt: now
          },
          status: {
            not: 'completed'
          }
        },
        select: {
          id: true,
          title: true,
          date: true,
          status: true
        }
      });

      console.log(`Found ${pastSessions.length} past sessions that need to be marked as completed`);

      // Update these sessions to be completed
      if (pastSessions.length > 0) {
        for (const session of pastSessions) {
          console.log(`Marking session ${session.title} as completed (was ${session.status})`);
          
          await prisma.session.update({
            where: {
              id: session.id
            },
            data: {
              status: 'completed'
            }
          });
        }

        console.log('Rechecking for completed sessions...');
        
        // Refetch the completed sessions
        const updatedCompletedSessions = await prisma.session.findMany({
          where: {
            status: 'completed'
          },
          select: {
            id: true,
            title: true
          }
        });
        
        console.log(`Now have ${updatedCompletedSessions.length} completed sessions`);
        
        // Update the completedSessions array for processing
        Object.assign(completedSessions, updatedCompletedSessions);
      }
    }

    // Initialize review states for each session
    let successCount = 0;
    for (const session of completedSessions) {
      const success = await initializeSessionReviews(session.id);
      if (success) {
        successCount++;
        console.log(`Successfully initialized reviews for session: ${session.title} (${session.id})`);
      }
    }

    console.log(`Initialized reviews for ${successCount} of ${completedSessions.length} sessions`);
    
    if (successCount > 0) {
      console.log('\nSUCCESS: Review initialization complete. Players can now rate each other for completed sessions.');
    } else {
      console.log('\nNOTICE: No sessions were initialized. Make sure you have completed sessions in your database.');
    }
  } catch (error) {
    console.error('Error initializing review states:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
initializeAllCompletedSessions().then(() => {
  console.log('Script completed');
}); 