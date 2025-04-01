import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { markNotificationsAsRead } from '@/lib/notifications';

/**
 * GET /api/notifications
 * Fetch all notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    
    if (!user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || undefined;

    // Build the query
    const whereClause: any = {
      userId: user.userId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (type) {
      whereClause.type = type;
    }

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Get the count of unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.userId,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser(request);
    
    if (!user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, all = false } = body;

    if (!all && (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0)) {
      return NextResponse.json(
        { error: 'Missing or invalid notificationIds' },
        { status: 400 }
      );
    }

    // Mark notifications as read
    await markNotificationsAsRead(user.userId, all ? undefined : notificationIds);

    return NextResponse.json({
      success: true,
      message: all ? 'All notifications marked as read' : 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 