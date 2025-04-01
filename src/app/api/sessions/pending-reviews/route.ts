import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

/**
 * GET /api/sessions/pending-reviews
 * Returns completed sessions where the user participated but hasn't reviewed all participants
 */
export async function GET(request: Request) {
  try {
    // Authenticate the user
    const user = await getUser(request as any);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.userId;

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
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
} 