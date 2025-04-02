import prisma from '@/lib/prisma';

/**
 * Initialize pending reviews for a completed session by:
 * 1. Calculating which participants need to review each other
 * 2. Storing a PendingReviewState record in the database to track this state
 * 
 * This ensures that review status is correctly initialized for all users
 * without requiring them to visit the session details page first.
 */
export async function initializeSessionReviews(sessionId: string) {
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

    // 4. Create or update PendingReviewState records using raw SQL
    for (const reviewData of pendingReviewsData) {
      await prisma.$executeRaw`
        INSERT INTO "PendingReviewState" (
          "id", "sessionId", "userId", "pendingReviewCount", 
          "hasUnreviewedPlayers", "reviewedAllPlayers", "lastUpdated"
        )
        VALUES (
          ${reviewData.id}, 
          ${reviewData.sessionId}, 
          ${reviewData.userId}, 
          ${reviewData.pendingReviewCount},
          ${reviewData.hasUnreviewedPlayers}, 
          ${reviewData.reviewedAllPlayers}, 
          ${reviewData.lastUpdated}
        )
        ON CONFLICT ("sessionId", "userId") 
        DO UPDATE SET
          "pendingReviewCount" = ${reviewData.pendingReviewCount},
          "hasUnreviewedPlayers" = ${reviewData.hasUnreviewedPlayers},
          "reviewedAllPlayers" = ${reviewData.reviewedAllPlayers},
          "lastUpdated" = ${reviewData.lastUpdated}
      `;
    }

    console.log(`Successfully initialized review state for session ${sessionId}`);
    return true;
  } catch (error: any) {
    console.error(`Error initializing session reviews for ${sessionId}:`, error.message);
    return false;
  }
} 