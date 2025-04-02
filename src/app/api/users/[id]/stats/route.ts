import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth";

// GET /api/users/[id]/stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Allow access without authentication for public profile data
    const userId = params.id;
    
    // Get sessions created by the user
    const createdSessions = await prisma.session.findMany({
      where: { creatorId: userId },
      select: { id: true, status: true }
    });
    
    // Count sessions by status
    const createdByStatus = {
      total: createdSessions.length,
      completed: createdSessions.filter(s => s.status === 'completed').length,
      cancelled: createdSessions.filter(s => s.status === 'cancelled').length,
      active: createdSessions.filter(s => s.status === 'active' || s.status === 'pending').length
    };
    
    // Get sessions where user is a participant
    const joinedSessionsRaw = await prisma.$queryRaw`
      SELECT s.id, s.status
      FROM "Session" s
      JOIN "_SessionPlayers" sp ON s.id = sp."A"
      WHERE sp."B" = ${userId}
    `;
    
    const joinedSessions = Array.isArray(joinedSessionsRaw) ? joinedSessionsRaw : [];
    
    // Count sessions that were cancelled by the host
    const affectedByCancellation = joinedSessions.filter((s: any) => s.status === 'cancelled').length;
    
    // Get user's left session count from activities
    const leftSessionsCount = await prisma.userActivity.count({
      where: {
        userId: userId,
        activityType: 'LEAVE_SESSION'
      }
    });
    
    // Count joined sessions by status
    const joinedByStatus = {
      total: joinedSessions.length,
      completed: joinedSessions.filter((s: any) => s.status === 'completed').length,
      cancelled: leftSessionsCount, // Actual left count from activities
      affectedByCancellation: affectedByCancellation, // Sessions cancelled by host
      active: joinedSessions.filter((s: any) => s.status === 'active' || s.status === 'pending').length
    };
    
    // Get all reviews for the user
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      select: {
        overallRating: true,
        skillLevel: true,
        sportsmanship: true,
        communication: true,
        punctuality: true,
        fairPlay: true
      }
    });
    
    // Calculate average ratings
    let avgRatings = {
      overall: 0,
      skillLevel: 0,
      sportsmanship: 0,
      communication: 0,
      punctuality: 0,
      fairPlay: 0,
      totalReviews: reviews.length
    };
    
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => {
        return {
          overall: acc.overall + review.overallRating,
          skillLevel: acc.skillLevel + review.skillLevel,
          sportsmanship: acc.sportsmanship + review.sportsmanship,
          communication: acc.communication + review.communication,
          punctuality: acc.punctuality + review.punctuality,
          fairPlay: acc.fairPlay + review.fairPlay
        };
      }, {
        overall: 0,
        skillLevel: 0,
        sportsmanship: 0,
        communication: 0,
        punctuality: 0,
        fairPlay: 0
      });
      
      avgRatings = {
        overall: Number((sum.overall / reviews.length).toFixed(1)),
        skillLevel: Number((sum.skillLevel / reviews.length).toFixed(1)),
        sportsmanship: Number((sum.sportsmanship / reviews.length).toFixed(1)),
        communication: Number((sum.communication / reviews.length).toFixed(1)),
        punctuality: Number((sum.punctuality / reviews.length).toFixed(1)),
        fairPlay: Number((sum.fairPlay / reviews.length).toFixed(1)),
        totalReviews: reviews.length
      };
    }
    
    // Get basic user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Combine all stats
    const stats = {
      user,
      sessions: {
        created: createdByStatus,
        joined: joinedByStatus,
        total: createdByStatus.total + joinedByStatus.total
      },
      ratings: avgRatings
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
} 