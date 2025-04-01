import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

/**
 * DELETE /api/bug-reports/clear
 * Clears all bug reports and deletes attachments
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
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
    
    // First, get all bug report screenshots to delete files
    const bugReports = await (prisma as any).bugReport.findMany({
      select: { screenshot: true }
    });
    
    // Delete attachment files
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bug-reports');
    
    try {
      // Get all files in the bug-reports directory
      const files = await readdir(uploadDir);
      
      // Delete each bug report file
      let deletedCount = 0;
      
      for (const report of bugReports) {
        if (report.screenshot) {
          // Extract the filename from the path
          const filename = report.screenshot.split('/').pop();
          
          if (filename && files.includes(filename)) {
            await unlink(path.join(uploadDir, filename));
            deletedCount++;
          }
        }
      }
      
      console.log(`Deleted ${deletedCount} attachment files`);
    } catch (fsError) {
      console.error('Error deleting attachment files:', fsError);
      // Continue with database cleanup even if file deletion fails
    }
    
    // Delete all bug reports using Prisma
    const deleteCount = await (prisma as any).bugReport.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      deletedReports: deleteCount?.count || 0,
      message: 'All bug reports and attachments have been cleared'
    });
  } catch (error) {
    console.error('Error clearing bug reports:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear bug reports',
      details: String(error)
    }, { status: 500 });
  }
} 