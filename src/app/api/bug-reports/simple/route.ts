import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

/**
 * POST /api/bug-reports/simple
 * Creates a new bug report - simplified version
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Log the request
    const body = await request.json();
    console.log('Bug report request data (simple):', body);
    
    const { message, screenshot } = body;
    
    // Simple validation
    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    console.log('User data:', { userId: user.userId });
    
    // Check if user exists in database
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true }
      });
      
      console.log('User exists in DB:', userExists);
      
      if (!userExists) {
        return NextResponse.json({ 
          error: 'User not found in database',
          userId: user.userId
        }, { status: 404 });
      }
    } catch (userCheckError) {
      console.error('Error checking user:', userCheckError);
      return NextResponse.json({
        error: 'Failed to verify user',
        details: String(userCheckError)
      }, { status: 500 });
    }
    
    // Basic data object with proper type casting
    const data: any = {
      message: message.trim(),
      userId: user.userId,
      status: 'new',
    };
    
    // Add screenshot conditionally
    if (screenshot) {
      data.screenshot = screenshot;
    }
    
    console.log('Attempting to create bug report with data:', data);
    
    // Try inserting with raw SQL if needed
    try {
      // Create the bug report with TypeScript casting
      const bugReport = await (prisma as any).bugReport.create({ data });
      console.log('Bug report created successfully:', bugReport);
      return NextResponse.json({ success: true, data: bugReport });
    } catch (createError: any) {
      console.error('Failed to create bug report:', createError);
      
      // Provide detailed error information
      return NextResponse.json({
        success: false,
        error: 'Failed to create bug report',
        code: createError?.code,
        meta: createError?.meta,
        message: createError?.message,
        // Add additional debug information
        data: data,
        prismaModels: Object.keys(prisma).filter(key => !key.startsWith('_')),
        bugReportExists: typeof (prisma as any).bugReport !== 'undefined'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in simple bug report creation:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Server error while creating bug report',
      details: String(error)
    }, { status: 500 });
  }
} 