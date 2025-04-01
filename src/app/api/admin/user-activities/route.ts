import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Verify the user is authenticated and an admin
    const user = await verifyAuth();

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Extract query parameters for filtering
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const activityType = url.searchParams.get('activityType');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clauses based on filters
    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (activityType) {
      whereClause.activityType = activityType;
    }

    // Date range filtering
    if (startDate || endDate) {
      whereClause.createdAt = {};
      
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        // Set the end of the day for the end date
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.userActivity.count({
      where: whereClause
    });

    // Get user activities with pagination and include user details
    const activities = await prisma.userActivity.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Return the activities and pagination info
    return NextResponse.json({
      activities,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 