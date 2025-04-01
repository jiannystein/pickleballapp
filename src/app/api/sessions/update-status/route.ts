import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// POST - Auto-update statuses of past sessions that aren't cancelled
export async function POST(request: NextRequest) {
  try {
    // Get the user - not required but used for logging
    const user = await getUser(request);
    const now = new Date();
    
    console.log('Checking for past sessions to update to completed status...');
    
    // First, find the sessions that need updating
    const pastSessions = await prisma.$queryRaw`
      SELECT id, title, date, status 
      FROM Session 
      WHERE date < ${now} 
      AND status NOT IN ('completed', 'cancelled')
    `;
    
    console.log(`Found ${Array.isArray(pastSessions) ? pastSessions.length : 0} past sessions to update`);
    
    if (!Array.isArray(pastSessions) || pastSessions.length === 0) {
      return NextResponse.json({
        message: "No sessions needed updating",
        updatedCount: 0
      });
    }
    
    // Update each session individually to avoid type issues
    let updatedCount = 0;
    const updatePromises = pastSessions.map(async (session: any) => {
      try {
        await prisma.session.update({
          where: { id: session.id },
          data: { status: 'completed' }
        });
        updatedCount++;
        return { success: true, id: session.id };
      } catch (err) {
        console.error(`Error updating session ${session.id}:`, err);
        return { success: false, id: session.id, error: err };
      }
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Updated ${updatedCount} sessions to completed status`);
    console.log('Sessions updated:', pastSessions.map((s: any) => ({ id: s.id, title: s.title })));
    
    return NextResponse.json({
      message: `Successfully updated ${updatedCount} past sessions to "completed"`,
      updatedCount,
      updatedSessions: pastSessions
    });
  } catch (error) {
    console.error('Error updating past sessions:', error);
    return NextResponse.json(
      { error: 'Failed to update past sessions' },
      { status: 500 }
    );
  }
} 