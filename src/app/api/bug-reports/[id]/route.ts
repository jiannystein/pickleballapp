import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

/**
 * GET /api/bug-reports/[id]
 * Get a specific bug report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const reportId = params.id;
    console.log(`Fetching bug report with ID: ${reportId}`);
    
    try {
      // Fetch bug report
      const bugReport = await (prisma as any).bugReport.findUnique({
        where: { id: reportId }
      });
      
      if (!bugReport) {
        console.log(`Bug report with ID ${reportId} not found`);
        return NextResponse.json({ error: 'Bug report not found' }, { status: 404 });
      }
      
      return NextResponse.json(bugReport);
    } catch (err) {
      console.error('Database error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch bug report' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching bug report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bug-reports/[id]
 * Update a bug report status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Received PATCH request for bug report ID: ${params.id}`);
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
    
    const reportId = params.id;
    
    // Parse request body safely
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { status } = body;
    
    // Validate input
    if (!status || !['new', 'completed', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "new", "completed", or "dismissed"' },
        { status: 400 }
      );
    }
    
    try {
      // Check if bug report exists first
      const existingReport = await (prisma as any).bugReport.findUnique({
        where: { id: reportId }
      });
      
      if (!existingReport) {
        console.log(`Bug report with ID ${reportId} not found`);
        return NextResponse.json({ error: 'Bug report not found' }, { status: 404 });
      }
      
      console.log(`Updating bug report ${reportId} status to ${status}`);
      
      // Update bug report status
      const updatedReport = await (prisma as any).bugReport.update({
        where: { id: reportId },
        data: { status }
      });
      
      if (!updatedReport) {
        return NextResponse.json(
          { error: 'Failed to update bug report' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(updatedReport);
    } catch (err) {
      console.error('Database error:', err);
      return NextResponse.json(
        { error: `Failed to update bug report: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating bug report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 