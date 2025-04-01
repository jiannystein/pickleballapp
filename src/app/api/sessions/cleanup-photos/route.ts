import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/sessions/cleanup-photos
 * Admin-only endpoint to clean up orphaned session photos
 */
export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const user = await getUser(request as any);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }
    
    console.log('Starting comprehensive session photos cleanup...');
    const sessionsUploadDir = join(process.cwd(), 'public', 'uploads', 'sessions');
    
    // Ensure the directory exists
    try {
      // Read all files in the sessions directory
      const files = await readdir(sessionsUploadDir);
      
      // Get all session photos from the database
      const photos = await prisma.sessionPhoto.findMany({
        select: {
          id: true,
          photoUrl: true,
          sessionId: true
        }
      });
      
      // Get all session IDs
      const activeSessions = await prisma.session.findMany({
        select: {
          id: true
        }
      });
      
      const activeSessionIds = new Set(activeSessions.map(s => s.id));
      
      // Organize photos by session
      const photosBySession = new Map();
      photos.forEach(photo => {
        if (!photosBySession.has(photo.sessionId)) {
          photosBySession.set(photo.sessionId, []);
        }
        photosBySession.get(photo.sessionId).push(photo);
      });
      
      // Create a set of valid filenames from photo URLs
      const validFilenames = new Set();
      photos.forEach(photo => {
        if (photo.photoUrl && photo.photoUrl.startsWith('/uploads/sessions/')) {
          const filename = photo.photoUrl.replace('/uploads/sessions/', '');
          validFilenames.add(filename);
        }
      });
      
      // Track statistics
      let orphanedPhotosCount = 0;
      let orphanedFilesCount = 0;
      let deletedDatabaseRecordsCount = 0;
      let deletedFilesCount = 0;
      
      // 1. Find orphaned database records (photos linked to deleted sessions)
      // Use Array.from to convert Map.entries() to a regular array
      Array.from(photosBySession.entries()).forEach(([sessionId, sessionPhotos]) => {
        if (!activeSessionIds.has(sessionId)) {
          console.log(`Found ${sessionPhotos.length} photos for deleted session: ${sessionId}`);
          orphanedPhotosCount += sessionPhotos.length;
          
          // Delete database records
          try {
            await prisma.sessionPhoto.deleteMany({
              where: {
                sessionId: sessionId
              }
            });
            
            deletedDatabaseRecordsCount += sessionPhotos.length;
            console.log(`Deleted ${sessionPhotos.length} DB records for session ${sessionId}`);
            
            // Also delete the associated files
            for (const photo of sessionPhotos) {
              if (photo.photoUrl && photo.photoUrl.startsWith('/uploads/sessions/')) {
                const filename = photo.photoUrl.replace('/uploads/sessions/', '');
                try {
                  const filePath = join(sessionsUploadDir, filename);
                  await unlink(filePath);
                  deletedFilesCount++;
                  console.log(`Deleted file: ${filename}`);
                } catch (error) {
                  console.error(`Failed to delete file ${filename}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error deleting photos for session ${sessionId}:`, error);
          }
        }
      });
      
      // 2. Find orphaned files (files not linked to any database record)
      for (const file of files) {
        if (!validFilenames.has(file)) {
          orphanedFilesCount++;
          
          // Check if the file is older than 1 hour (3600000 ms) to avoid race conditions
          try {
            const filePath = join(sessionsUploadDir, file);
            const fileStats = await stat(filePath);
            const fileAge = Date.now() - fileStats.mtimeMs;
            
            if (fileAge > 3600000) {
              await unlink(filePath);
              deletedFilesCount++;
              console.log(`Deleted orphaned file: ${file}`);
            } else {
              console.log(`Skipping recent file: ${file} (age: ${Math.round(fileAge / 1000)} seconds)`);
            }
          } catch (error) {
            console.error(`Failed to process orphaned file ${file}:`, error);
          }
        }
      }
      
      // Compile results
      const results = {
        orphanedPhotosFound: orphanedPhotosCount,
        orphanedFilesFound: orphanedFilesCount,
        databaseRecordsDeleted: deletedDatabaseRecordsCount,
        filesDeleted: deletedFilesCount
      };
      
      console.log('Session photos cleanup completed with results:', results);
      
      // Return success response with cleanup results
      return NextResponse.json({
        success: true,
        message: 'Session photos cleanup completed',
        results
      });
      
    } catch (error: any) {
      console.error('Error accessing sessions upload directory:', error);
      return NextResponse.json({
        error: 'Failed to access upload directory',
        message: error.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      message: error.message
    }, { status: 500 });
  }
} 