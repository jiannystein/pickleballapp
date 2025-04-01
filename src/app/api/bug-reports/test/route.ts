import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

/**
 * GET /api/bug-reports/test
 * Tests if we can access the bug report model
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Test database connectivity
    const testResults = {
      prismaConnection: true,
      userModel: false,
      bugReportModel: false,
      userExists: false,
      schemaInfo: null as any,
      error: null as string | null
    };
    
    try {
      // Test user model
      const userCount = await prisma.user.count();
      testResults.userModel = true;
      
      // Test if user exists
      const userExists = await prisma.user.findUnique({
        where: { id: user.userId }
      });
      testResults.userExists = !!userExists;
      
      // Test bug report model
      try {
        // Attempt to access the model
        const bugReportCount = await (prisma as any).bugReport.count();
        testResults.bugReportModel = true;
        
        // Get schema information
        const dmmf = (prisma as any)._baseDmmf?.datamodel?.models;
        const bugReportModel = dmmf?.find((model: any) => model.name === 'BugReport');
        if (bugReportModel) {
          testResults.schemaInfo = {
            fields: bugReportModel.fields.map((field: any) => ({
              name: field.name,
              type: field.type,
              isRequired: !field.isNullable,
              isUnique: field.isUnique || false
            }))
          };
        }
      } catch (err) {
        testResults.error = `Bug report model error: ${err}`;
      }
    } catch (dbError) {
      testResults.prismaConnection = false;
      testResults.error = `Database connection error: ${dbError}`;
    }
    
    return NextResponse.json(testResults);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bug-reports/test
 * Tests the bug report creation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request data and log it
    const { message = "Test bug report" } = await request.json();
    
    // Create a test report directly in the database
    try {
      // Try with screenshot field
      const testReport = await (prisma as any).bugReport.create({
        data: {
          message,
          userId: user.userId,
          status: 'new',
          screenshot: "Test screenshot URL"
        }
      });
      
      return NextResponse.json({
        success: true,
        report: testReport,
        fieldUsed: 'screenshot'
      });
    } catch (error) {
      console.error('Error creating test report with screenshot:', error);
      
      try {
        // Try with attachmentUrl field
        const testReport = await (prisma as any).bugReport.create({
          data: {
            message,
            userId: user.userId,
            status: 'new',
            attachmentUrl: "Test attachment URL"
          }
        });
        
        return NextResponse.json({
          success: true,
          report: testReport,
          fieldUsed: 'attachmentUrl'
        });
      } catch (secondError) {
        console.error('Error creating test report with attachmentUrl:', secondError);
        
        return NextResponse.json({
          success: false,
          error: {
            message: 'Failed to create test bug report',
            screenshotError: String(error),
            attachmentUrlError: String(secondError)
          }
        }, { status: 500 });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
} 