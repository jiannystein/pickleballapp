import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { Pool } from 'pg';

/**
 * GET /api/bug-reports
 * Gets all bug reports with pagination and filtering
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
    
    // Get pagination params
    const searchParams = new URL(request.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');
    
    // Set up query filter
    const where = status && status !== 'all' ? { status } : {};
    
    try {
      // Try direct database query if Prisma model has schema issues
      try {
        // Try to fetch bug reports with user information using Prisma
        const bugReports = await (prisma as any).bugReport.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip: offset,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }).catch((err: any) => {
          console.error('Error in Prisma findMany:', err);
          throw err; // Re-throw to trigger the fallback query
        });
        
        console.log(`Fetched ${bugReports.length} bug reports with Prisma`);
        
        // Count total bug reports
        const total = await (prisma as any).bugReport.count({ where }).catch(() => 0);
        
        return NextResponse.json({ 
          bugReports: bugReports || [], 
          total: total || 0 
        });
      } catch (prismaErr) {
        // Fallback to direct SQL if Prisma has schema issues
        console.log('Falling back to direct SQL query due to Prisma error');
        
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        
        const client = await pool.connect();
        
        try {
          // Build the SQL query with proper pagination and sorting
          let query = `
            SELECT b.*, u.id as "userId", u.name, u.email, u."avatarUrl"
            FROM "BugReport" b
            LEFT JOIN "User" u ON b."userId" = u.id
          `;
          
          // Add where clause for status filtering
          if (status && status !== 'all') {
            query += ` WHERE b.status = $1`;
          }
          
          // Add ordering
          query += ` ORDER BY b."createdAt" DESC`;
          
          // Add pagination
          query += ` LIMIT $${status && status !== 'all' ? 2 : 1} OFFSET $${status && status !== 'all' ? 3 : 2}`;
          
          // Set up query parameters
          const queryParams = status && status !== 'all' 
            ? [status, limit, offset] 
            : [limit, offset];
          
          // Execute the query
          const result = await client.query(query, queryParams);
          
          // Get total count
          const countQuery = status && status !== 'all'
            ? `SELECT COUNT(*) FROM "BugReport" WHERE status = $1`
            : `SELECT COUNT(*) FROM "BugReport"`;
          
          const countParams = status && status !== 'all' ? [status] : [];
          const countResult = await client.query(countQuery, countParams);
          const total = parseInt(countResult.rows[0].count, 10);
          
          // Format the results
          const bugReports = result.rows.map(row => {
            // Extract user fields
            const user = {
              id: row.userId,
              name: row.name,
              email: row.email,
              avatarUrl: row.avatarUrl
            };
            
            // Remove user fields from the main report object
            delete row.name;
            delete row.email;
            delete row.avatarUrl;
            
            // Return formatted report
            return {
              ...row,
              user
            };
          });
          
          console.log(`Fetched ${bugReports.length} bug reports with direct SQL`);
          
          return NextResponse.json({ 
            bugReports: bugReports || [], 
            total: total || 0 
          });
        } finally {
          client.release();
        }
      }
    } catch (err) {
      console.error('Database error:', err);
      // Return empty results if there's a database error
      return NextResponse.json({ 
        bugReports: [], 
        total: 0 
      });
    }
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json(
      { error: 'Internal server error', bugReports: [], total: 0 },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bug-reports
 * Creates a new bug report
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const requestData = await request.json();
    console.log('Bug report request data:', requestData);
    
    const { message, screenshot, attachmentUrl } = requestData;
    
    // Validate input
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    
    if (!userExists) {
      console.error('User not found:', user.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Try to create bug report with either field name
    let bugReport = null;
    let createError = null;
    
    // Prepare data with all required fields
    const reportData = {
      message: message.trim(),
      userId: user.userId,
      status: 'new'
    };
    
    // First attempt with screenshot field
    try {
      console.log('Attempting to create bug report with screenshot field');
      bugReport = await (prisma as any).bugReport.create({
        data: {
          ...reportData,
          screenshot: screenshot || attachmentUrl
        }
      });
      console.log('Successfully created bug report with screenshot field');
    } catch (error) {
      console.error('Error creating bug report with screenshot field:', error);
      createError = error;
      
      // Second attempt with attachmentUrl field
      try {
        console.log('Attempting to create bug report with attachmentUrl field');
        bugReport = await (prisma as any).bugReport.create({
          data: {
            ...reportData,
            attachmentUrl: attachmentUrl || screenshot
          }
        });
        console.log('Successfully created bug report with attachmentUrl field');
      } catch (secondError) {
        console.error('Error creating bug report with attachmentUrl field:', secondError);
        createError = secondError;
      }
    }
    
    if (!bugReport) {
      console.error('Failed to create bug report:', createError);
      return NextResponse.json(
        { 
          error: 'Failed to create bug report',
          details: createError ? String(createError) : 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.log('Bug report created successfully:', bugReport);
    return NextResponse.json(bugReport);
  } catch (error) {
    console.error('Error creating bug report:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: String(error)
      },
      { status: 500 }
    );
  }
} 