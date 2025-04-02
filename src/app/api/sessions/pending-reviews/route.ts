import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// Define types for our pending review state
interface PendingReviewState {
  id: string;
  sessionId: string;
  userId: string;
  pendingReviewCount: number;
  hasUnreviewedPlayers: boolean;
  reviewedAllPlayers: boolean;
  lastUpdated: Date;
}

/**
 * GET /api/sessions/pending-reviews
 * Returns completed sessions where the user participated but hasn't reviewed all participants
 * Using the PendingReviewState model for improved performance
 */
export async function GET(request: Request) {
  try {
    // Authenticate the user
    const user = await getUser(request as any);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.userId;

    // First check if we have already calculated pending reviews
    const pendingReviewStates = await prisma.$queryRaw<PendingReviewState[]>`
      SELECT * FROM "PendingReviewState" 
      WHERE "userId" = ${currentUserId} AND "hasUnreviewedPlayers" = true
    `;

    // If we have pending review states, use them for fast access
    if (pendingReviewStates.length > 0) {
      console.log(`Found ${pendingReviewStates.length} pre-calculated pending review states for user`);
      
      // Get the sessions associated with these pending reviews
      const sessionIds = pendingReviewStates.map(state => state.sessionId);
      
      const sessions = await prisma.session.findMany({
        where: {
          id: { in: sessionIds },
          status: 'completed'
        },
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
          },
          reviews: {
            where: {
              reviewerId: currentUserId
            },
            select: {
              revieweeId: true
            }
          }
        }
      });

      // Map sessions to include pending review information
      const sessionsWithPendingReviews = sessions.map(session => {
        // Find the corresponding pending review state
        const reviewState = pendingReviewStates.find(state => state.sessionId === session.id);
        
        // Calculate pending review players
        // Get IDs of all participants except the current user
        const participantIds = new Set<string>();
        
        // Add the creator if not the current user
        if (session.creator.id !== currentUserId) {
          participantIds.add(session.creator.id);
        }
        
        // Add all players except the current user
        session.players.forEach(player => {
          if (player.id !== currentUserId) {
            participantIds.add(player.id);
          }
        });
        
        // Get IDs of participants the user has already reviewed
        const reviewedIds = new Set(session.reviews.map(review => review.revieweeId));
        
        // Find IDs of participants the user hasn't reviewed yet
        const pendingReviewIds = Array.from(participantIds).filter(id => !reviewedIds.has(id));
        
        // Names of players that need reviews
        const pendingReviewPlayers = [...session.players, session.creator]
          .filter(player => pendingReviewIds.includes(player.id))
          .map(player => ({
            id: player.id,
            name: player.name,
            avatarUrl: player.avatarUrl
          }));
          
        return {
          id: session.id,
          title: session.title,
          date: session.date,
          totalParticipants: participantIds.size,
          pendingReviewsCount: reviewState?.pendingReviewCount || pendingReviewIds.length,
          pendingReviewPlayers,
          allReviewsComplete: pendingReviewIds.length === 0
        };
      });

      // Filter out any sessions where all reviews are now complete
      const filteredSessions = sessionsWithPendingReviews.filter(
        session => !session.allReviewsComplete
      );

      // Update any review states that may have changed
      for (const session of sessionsWithPendingReviews) {
        if (session.allReviewsComplete) {
          // This session no longer has pending reviews, update the state
          await prisma.$executeRaw`
            UPDATE "PendingReviewState"
            SET 
              "pendingReviewCount" = 0,
              "hasUnreviewedPlayers" = false,
              "reviewedAllPlayers" = true,
              "lastUpdated" = ${new Date()}
            WHERE "sessionId" = ${session.id} AND "userId" = ${currentUserId}
          `;
        }
      }

      return NextResponse.json({
        totalPendingReviews: filteredSessions.length,
        sessions: filteredSessions
      });
    }
    
    // If we don't have calculated states, fall back to original implementation
    // (This should only happen for older sessions that were completed before this feature was added)
    
    // 1. Get all completed sessions where the user participated (as creator or player)
    const userCompletedSessions = await prisma.session.findMany({
      where: {
        OR: [
          { creatorId: currentUserId },
          {
            players: {
              some: {
                id: currentUserId
              }
            }
          }
        ],
        status: 'completed'
      },
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
        },
        reviews: {
          where: {
            reviewerId: currentUserId
          },
          select: {
            revieweeId: true
          }
        }
      }
    });

    // 2. For each session, check if the user has reviewed all other participants
    const sessionsWithPendingReviews = userCompletedSessions.map(session => {
      // Get IDs of all participants except the current user
      const participantIds = new Set<string>();
      
      // Add the creator if not the current user
      if (session.creator.id !== currentUserId) {
        participantIds.add(session.creator.id);
      }
      
      // Add all players except the current user
      session.players.forEach(player => {
        if (player.id !== currentUserId) {
          participantIds.add(player.id);
        }
      });
      
      // Get IDs of participants the user has already reviewed
      const reviewedIds = new Set(session.reviews.map(review => review.revieweeId));
      
      // Find IDs of participants the user hasn't reviewed yet
      const pendingReviewIds = Array.from(participantIds).filter(id => !reviewedIds.has(id));
      
      // Count of players that need reviews
      const pendingReviewsCount = pendingReviewIds.length;
      
      // Names of players that need reviews
      const pendingReviewPlayers = [...session.players, session.creator]
        .filter(player => pendingReviewIds.includes(player.id))
        .map(player => ({
          id: player.id,
          name: player.name,
          avatarUrl: player.avatarUrl
        }));
      
      // Create or update pending review state for this session
      try {
        prisma.$executeRaw`
          INSERT INTO "PendingReviewState" ("id", "sessionId", "userId", "pendingReviewCount", "hasUnreviewedPlayers", "reviewedAllPlayers", "lastUpdated")
          VALUES (
            ${`pk_${session.id}_${currentUserId}`}, 
            ${session.id}, 
            ${currentUserId}, 
            ${pendingReviewsCount}, 
            ${pendingReviewsCount > 0}, 
            ${pendingReviewsCount === 0}, 
            ${new Date()}
          )
          ON CONFLICT ("sessionId", "userId") DO UPDATE SET
            "pendingReviewCount" = ${pendingReviewsCount},
            "hasUnreviewedPlayers" = ${pendingReviewsCount > 0},
            "reviewedAllPlayers" = ${pendingReviewsCount === 0},
            "lastUpdated" = ${new Date()}
        `;
      } catch (error: any) {
        console.error(`Error updating pending review state for session ${session.id}:`, error.message);
      }
      
      // Return session with pending review information
      return {
        id: session.id,
        title: session.title,
        date: session.date,
        totalParticipants: participantIds.size,
        pendingReviewsCount,
        pendingReviewPlayers,
        allReviewsComplete: pendingReviewsCount === 0
      };
    });

    // 3. Filter out sessions where all reviews are complete
    const filteredSessions = sessionsWithPendingReviews.filter(
      session => !session.allReviewsComplete
    );

    // Return the pending review sessions with counts
    return NextResponse.json({
      totalPendingReviews: filteredSessions.length,
      sessions: filteredSessions
    });
  } catch (error: any) {
    console.error('Error fetching pending reviews:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
} 