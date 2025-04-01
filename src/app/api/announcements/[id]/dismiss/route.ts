import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST /api/announcements/[id]/dismiss - Dismiss an announcement for the current user
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await verifyAuth();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.userId;
    const announcementId = params.id;

    // Create or update user announcement record
    const userAnnouncement = await prisma.userAnnouncement.upsert({
      where: {
        userId_announcementId: {
          userId,
          announcementId
        }
      },
      update: {
        dismissed: true,
        dismissedAt: new Date()
      },
      create: {
        userId,
        announcementId,
        dismissed: true,
        dismissedAt: new Date()
      }
    });

    return NextResponse.json(userAnnouncement);
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss announcement' },
      { status: 500 }
    );
  }
} 