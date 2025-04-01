import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getUser } from '@/lib/auth';

// Create a new Pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * POST /api/bug-reports/direct
 * Creates a new bug report using direct SQL
 */
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    // Authenticate user
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Log the request
    const body = await request.json();
    console.log('Bug report request data (direct):', body);
    
    const { message, screenshot } = body;
    
    // Simple validation
    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Check if user exists
    const userCheck = await client.query(
      'SELECT id FROM "User" WHERE id = $1',
      [user.userId]
    );
    
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User not found in database',
        userId: user.userId
      }, { status: 404 });
    }
    
    // Insert bug report directly using SQL
    const query = `
      INSERT INTO "BugReport" (
        id, "userId", message, screenshot, status, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `;
    
    const now = new Date();
    const id = `clr${Math.random().toString(36).substring(2, 11)}`;
    
    const values = [
      id,                // id
      user.userId,       // userId
      message.trim(),    // message
      screenshot || null, // screenshot
      'new',            // status
      now,              // createdAt
      now               // updatedAt
    ];
    
    console.log('Executing SQL with values:', values);
    
    const result = await client.query(query, values);
    const bugReport = result.rows[0];
    
    console.log('Bug report created successfully:', bugReport);
    return NextResponse.json({ success: true, data: bugReport });
  } catch (error) {
    console.error('Error in direct bug report creation:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Server error while creating bug report',
      details: String(error)
    }, { status: 500 });
  } finally {
    client.release();
  }
} 