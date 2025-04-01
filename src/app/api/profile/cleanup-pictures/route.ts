import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';

/**
 * API endpoint to clean up all profile pictures
 * GET /api/profile/cleanup-pictures
 * 
 * This endpoint removes:
 * 1. Old profile pictures for each user (keeping only their latest)
 * 2. Orphaned profile pictures that aren't linked to any user
 */
export async function GET(request: Request) {
  try {
    // Only allow admins to run this
    const user = await getUser(request as any);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting comprehensive profile picture cleanup...');
    
    // Get the profile pictures directory
    const profilePicsDir = join(process.cwd(), 'public', 'uploads', 'profile-pictures');
    
    // Read all files in the directory
    const files = await readdir(profilePicsDir);
    console.log(`Found ${files.length} total profile pictures`);
    
    // Get all users with profile pictures
    const users = await prisma.user.findMany({
      where: {
        avatarUrl: {
          not: null
        }
      },
      select: {
        id: true,
        avatarUrl: true
      }
    });
    
    console.log(`Found ${users.length} users with avatars`);
    
    // Create a map to track the latest file for each user
    const userLatestFiles = new Map();
    const validFilenames = new Set();
    
    // Track the latest file for each user based on the timestamp in the filename
    for (const file of files) {
      // Match the pattern: {userId}-{timestamp}.{extension}
      const match = file.match(/^(cm\w+)-(\d+)\.(.+)$/);
      if (match) {
        const [, userId, timestamp] = match;
        
        // Keep track of the latest file for each user
        if (!userLatestFiles.has(userId) || parseInt(timestamp) > userLatestFiles.get(userId).timestamp) {
          userLatestFiles.set(userId, {
            filename: file,
            timestamp: parseInt(timestamp)
          });
        }
      }
    }
    
    // Mark the current avatar URLs as valid
    users.forEach(user => {
      if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/profile-pictures/')) {
        const filename = user.avatarUrl.replace('/uploads/profile-pictures/', '');
        validFilenames.add(filename);
      }
    });
    
    // Also mark the latest file for each user as valid
    userLatestFiles.forEach(fileInfo => {
      validFilenames.add(fileInfo.filename);
    });
    
    // Results tracking
    const results = {
      outdated: 0,
      orphaned: 0,
      kept: validFilenames.size,
      errors: [] as string[]
    };
    
    // Delete files that are not valid (not the latest or not referenced in avatarUrl)
    for (const file of files) {
      if (!validFilenames.has(file)) {
        try {
          // Check if the file is older than 1 hour (3600000 ms)
          // This is a safety precaution for files that might be in use
          const filePath = join(profilePicsDir, file);
          const fileStats = await stat(filePath);
          const fileAge = Date.now() - fileStats.mtimeMs;
          
          if (fileAge > 3600000) {
            await unlink(filePath);
            
            // Check if it's an outdated user file or an orphaned file
            const match = file.match(/^(cm\w+)-(\d+)\.(.+)$/);
            if (match && userLatestFiles.has(match[1])) {
              console.log(`Deleted outdated profile picture: ${file}`);
              results.outdated++;
            } else {
              console.log(`Deleted orphaned profile picture: ${file}`);
              results.orphaned++;
            }
          } else {
            console.log(`Skipping recently modified file: ${file}`);
          }
        } catch (error) {
          console.error(`Failed to delete file ${file}:`, error);
          results.errors.push(`Error with file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Return success response with cleanup results
    return NextResponse.json({
      success: true,
      message: 'Profile picture cleanup completed',
      results: {
        total_files: files.length,
        files_kept: results.kept,
        outdated_removed: results.outdated,
        orphaned_removed: results.orphaned,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clean up profile pictures',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 