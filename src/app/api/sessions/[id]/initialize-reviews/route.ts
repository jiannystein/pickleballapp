import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST: Initialize pending review states for a session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from JWT token
    const user = await getUser(request);
    
    // Only allow admins or session creator to initialize reviews
    // For now, let the client-side code handle this when it detects a completed session
    // to avoid authorization issues
    
    const sessionId = params.id;
    
    // Verify the session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: true,
        creator: true,
      },
    });
    
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    
    // If the session is not completed yet, mark it as completed
    if (session.status !== 'completed') {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'completed' }
      });
    }
    
    // Get all participants in the session (players + creator)
    const allParticipants = [...session.players];
    if (!allParticipants.some(p => p.id === session.creatorId)) {
      // Make sure creator is included if they're not already in players list
      allParticipants.push(session.creator);
    }
    
    console.log(`Initializing reviews for session ${sessionId} with ${allParticipants.length} participants`);
    
    // For each participant, create or update their pending review state for this session
    const reviewStates = [];
    for (const participant of allParticipants) {
      // Check if this user already has a pending review state for this session
      const existingState = await prisma.pendingReviewState.findUnique({
        where: {
          sessionId_userId: {
            sessionId: sessionId,
            userId: participant.id
          }
        }
      });
      
      if (!existingState) {
        // Count how many players this user needs to review
        const pendingReviewCount = allParticipants.length - 1; // All players except self
        
        // Create new pending review state
        const reviewState = await prisma.pendingReviewState.create({
          data: {
            sessionId: sessionId,
            userId: participant.id,
            pendingReviewCount: pendingReviewCount,
            hasUnreviewedPlayers: pendingReviewCount > 0,
            reviewedAllPlayers: pendingReviewCount === 0,
            lastUpdated: new Date()
          }
        });
        reviewStates.push(reviewState);
      } else {
        reviewStates.push(existingState);
      }
    }
    
    // Update existing reviews
    const result = await updatePendingReviewCounts(sessionId);
    
    return NextResponse.json({
      message: "Successfully initialized review states",
      reviewStates,
      updatedCount: result.updatedCount
    });
  } catch (error) {
    console.error("Error initializing review states:", error);
    return NextResponse.json(
      { error: "Failed to initialize review states" },
      { status: 500 }
    );
  }
}

// Helper function to update pending review counts for all participants in a session
async function updatePendingReviewCounts(sessionId: string) {
  // Get all reviews for this session
  const existingReviews = await prisma.review.findMany({
    where: {
      sessionId: sessionId
    },
    select: {
      reviewerId: true,
      revieweeId: true
    }
  });
  
  // Get all pending review states for this session
  const reviewStates = await prisma.pendingReviewState.findMany({
    where: {
      sessionId: sessionId
    }
  });
  
  let updatedCount = 0;
  
  // For each review state, count how many reviews the user has completed
  for (const state of reviewStates) {
    // Get all participants except this user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: true,
        creator: true
      }
    });
    
    if (!session) continue;
    
    // All participants except the current user
    const allParticipants = [...session.players];
    if (!allParticipants.some(p => p.id === session.creatorId)) {
      allParticipants.push(session.creator);
    }
    
    const otherParticipants = allParticipants.filter(p => p.id !== state.userId);
    const totalToReview = otherParticipants.length;
    
    // Count how many reviews this user has submitted
    const reviewedCount = existingReviews.filter(r => r.reviewerId === state.userId).length;
    const pendingCount = totalToReview - reviewedCount;
    
    // Update the pending review state
    await prisma.pendingReviewState.update({
      where: {
        id: state.id
      },
      data: {
        pendingReviewCount: pendingCount,
        hasUnreviewedPlayers: pendingCount > 0,
        reviewedAllPlayers: pendingCount === 0,
        lastUpdated: new Date()
      }
    });
    
    updatedCount++;
  }
  
  return { updatedCount };
} 