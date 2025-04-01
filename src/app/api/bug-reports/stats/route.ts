import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

/**
 * GET /api/bug-reports/stats
 * Get statistics about bug reports by status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true }
    });
    
    if (!userRecord?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Get counts by status
    try {
      // Get count of new reports
      const newCount = await (prisma as any).bugReport.count({
        where: { status: 'new' }
      }).catch(() => 0);
      
      // Get count of completed reports
      const completedCount = await (prisma as any).bugReport.count({
        where: { status: 'completed' }
      }).catch(() => 0);
      
      // Get count of dismissed reports
      const dismissedCount = await (prisma as any).bugReport.count({
        where: { status: 'dismissed' }
      }).catch(() => 0);
      
      // Get total count
      const totalCount = await (prisma as any).bugReport.count().catch(() => 0);
      
      return NextResponse.json({ 
        stats: {
          new: newCount,
          completed: completedCount,
          dismissed: dismissedCount,
          total: totalCount
        }
      });
      
    } catch (err) {
      console.error('Database error:', err);
      // Return zeros if there's a database error
      return NextResponse.json({ 
        stats: {
          new: 0,
          completed: 0,
          dismissed: 0,
          total: 0
        }
      });
    }
  } catch (error) {
    console.error('Error fetching bug report stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 