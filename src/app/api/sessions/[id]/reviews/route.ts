import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth";

// Helper function to update a user's average rating
async function updateUserAverageRating(userId: string) {
  try {
    // Get all reviews for this user
    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
      },
    });
    
    if (reviews.length === 0) {
      // If no reviews, set rating to 0
      await prisma.user.update({
        where: { id: userId },
        data: { rating: 0 },
      });
      return;
    }
    
    // Calculate the average overall rating
    const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
    const averageRating = totalRating / reviews.length;
    
    // Update the user's rating in the database
    await prisma.user.update({
      where: { id: userId },
      data: { rating: averageRating },
    });
    
  } catch (error) {
    console.error("Error updating user rating:", error);
  }
}

// GET: Fetch reviews for a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching reviews for session:', params.id);
    
    // Get URL to check for pending parameter
    const url = new URL(request.url);
    const isPendingRequest = url.searchParams.has('userId');
    
    // First try to get user from JWT token directly
    const user = await getUser(request);
    
    console.log('User from JWT:', user ? `User: ${user.name}, Email: ${user.email}, ID: ${user.userId}` : 'No user found');
    
    // Check if user is authenticated - use userId from JWT directly
    if (!user?.userId) {
      console.log('Unauthorized - No valid userId in JWT');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const currentUserId = user.userId; // Use userId instead of id
    console.log('Using currentUserId:', currentUserId);
    const sessionId = params.id;
    
    // Verify the session exists
    const gameSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: true,
        creator: true,
      },
    });
    
    if (!gameSession) {
      console.log('Session not found:', sessionId);
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    
    console.log('Session found:', gameSession.id, 'Title:', gameSession.title);
    console.log('Creator:', gameSession.creator.id, 'Players:', gameSession.players.length);
    
    // Verify if the user participated in this session (either as player or creator)
    const userParticipated = 
      gameSession.creatorId === currentUserId || 
      gameSession.players.some((player) => player.id === currentUserId);
    
    console.log('User participated:', userParticipated);
    
    if (!userParticipated) {
      console.log('User did not participate in this session');
      return NextResponse.json(
        { error: "You don't have access to reviews for this session" },
        { status: 403 }
      );
    }

    // Handle pending reviews request
    if (isPendingRequest) {
      console.log('Handling pending reviews request');
      
      // Get all participants except the current user
      const participants = [];
      
      // Add the creator if not the current user
      if (gameSession.creator.id !== currentUserId) {
        participants.push({
          id: gameSession.creator.id,
          name: gameSession.creator.name,
          avatarUrl: gameSession.creator.avatarUrl,
          isHost: true
        });
      }
      
      // Add all players except the current user
      gameSession.players.forEach(player => {
        if (player.id !== currentUserId) {
          participants.push({
            id: player.id,
            name: player.name,
            avatarUrl: player.avatarUrl,
            isHost: player.id === gameSession.creator.id
          });
        }
      });
      
      // Get reviews the current user has already submitted
      const existingReviews = await prisma.review.findMany({
        where: {
          sessionId,
          reviewerId: currentUserId
        },
        select: {
          revieweeId: true
        }
      });
      
      // Get set of already reviewed player IDs
      const reviewedPlayerIds = new Set(existingReviews.map(review => review.revieweeId));
      
      // Filter for players that still need reviews
      const pendingReviews = participants.filter(player => !reviewedPlayerIds.has(player.id));
      
      return NextResponse.json({
        pendingReviews,
        allReviewsComplete: pendingReviews.length === 0
      });
    }
    
    // Fetch reviews (normal flow)
    const reviews = await prisma.review.findMany({
      where: { sessionId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    console.log('Reviews found:', reviews.length);
    
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching session reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST: Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from JWT token directly
    const user = await getUser(request);
    
    console.log('POST review - User from JWT:', user ? `User: ${user.name}, Email: ${user.email}` : 'No user found');
    
    // Check if user is authenticated - use userId from JWT directly
    if (!user?.userId) {
      console.log('POST review - Unauthorized: No valid userId in JWT');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const sessionId = params.id;
    const currentUserId = user.userId; // Use userId instead of id
    
    console.log('POST review - Using userId:', currentUserId);
    
    // Parse request body
    const body = await request.json();
    const { 
      revieweeId,
      skillLevel,
      sportsmanship,
      communication,
      punctuality,
      fairPlay,
      comment
    } = body;
    
    // Verify all required fields are present
    if (!revieweeId || !skillLevel || !sportsmanship || !communication || !punctuality || !fairPlay) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate ratings (must be 1-5)
    const ratings = [skillLevel, sportsmanship, communication, punctuality, fairPlay];
    if (ratings.some(rating => !Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Ratings must be integers between 1 and 5" },
        { status: 400 }
      );
    }
    
    // Verify the game session exists and is completed
    const gameSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        players: true,
        creator: true,
      },
    });
    
    if (!gameSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    
    if (gameSession.status !== "completed") {
      return NextResponse.json(
        { error: "Reviews can only be submitted for completed sessions" },
        { status: 400 }
      );
    }
    
    // Verify the user participated in this session
    const userParticipated = 
      gameSession.creatorId === currentUserId || 
      gameSession.players.some((player) => player.id === currentUserId);
    
    if (!userParticipated) {
      return NextResponse.json(
        { error: "You must have participated in the session to submit a review" },
        { status: 403 }
      );
    }
    
    // Verify the reviewee participated in this session
    const revieweeParticipated = 
      gameSession.creatorId === revieweeId || 
      gameSession.players.some((player) => player.id === revieweeId);
    
    if (!revieweeParticipated) {
      return NextResponse.json(
        { error: "The player you're trying to review didn't participate in this session" },
        { status: 400 }
      );
    }
    
    // Prevent self-reviews
    if (currentUserId === revieweeId) {
      return NextResponse.json(
        { error: "You cannot review yourself" },
        { status: 400 }
      );
    }
    
    // Check if the user has already reviewed this player for this session
    const existingReview = await prisma.review.findFirst({
      where: {
        sessionId,
        reviewerId: currentUserId,
        revieweeId,
      }
    });
    
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this player for this session" },
        { status: 400 }
      );
    }
    
    // Calculate overall rating
    const overallRating = (skillLevel + sportsmanship + communication + punctuality + fairPlay) / 5;
    
    // Create the review
    const review = await prisma.review.create({
      data: {
        sessionId,
        reviewerId: currentUserId,
        revieweeId,
        overallRating,
        skillLevel,
        sportsmanship,
        communication,
        punctuality,
        fairPlay,
        comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
      },
    });
    
    // Update the user's average rating
    await updateUserAverageRating(revieweeId);
    
    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
} 