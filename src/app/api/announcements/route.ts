import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/announcements - Get all active announcements for the current user
export async function GET(req: Request) {
  try {
    const token = await verifyAuth();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.userId;

    // Get all active announcements and user's dismissed status
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        userAnnouncements: {
          where: { userId }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    // Format the response
    const formattedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      dismissed: announcement.userAnnouncements[0]?.dismissed || false
    }));

    return NextResponse.json(formattedAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/announcements - Create a new announcement (admin only)
export async function POST(req: Request) {
  try {
    const token = await verifyAuth();
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, priority, expiresAt } = body;

    // Validate input
    if (!title || !message || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: token.userId }
    });

    if (!user) {
      console.error(`User with ID ${token.userId} not found in database`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if there are already 3 active announcements
    const activeCount = await prisma.announcement.count({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (activeCount >= 3) {
      return NextResponse.json({ error: 'Maximum number of active announcements reached' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        priority,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: user.id, // Use the verified user ID from the database
        isActive: true
      }
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 