import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { readdir, rename, access } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { constants } from 'fs';

/**
 * API endpoint to migrate existing profile pictures to the dedicated folder
 * GET /api/profile/migrate-avatars
 */
export async function GET(request: Request) {
  try {
    // Only allow admins to run this
    const user = await getUser(request as any);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting migration of profile pictures...');
    
    // Get all users with profile pictures
    const users = await prisma.user.findMany({
      where: {
        avatarUrl: {
          startsWith: '/uploads/',
          not: {
            startsWith: '/uploads/profile-pictures/'
          }
        }
      },
      select: {
        id: true,
        avatarUrl: true
      }
    });

    console.log(`Found ${users.length} users with avatars to migrate.`);
    
    // Ensure profile pictures directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const profilePicsDir = join(uploadsDir, 'profile-pictures');
    
    await mkdir(profilePicsDir, { recursive: true });
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Process each user's avatar
    for (const user of users) {
      try {
        if (!user.avatarUrl) {
          results.skipped++;
          continue;
        }
        
        // Extract the filename from the URL
        const oldFilename = user.avatarUrl.replace('/uploads/', '');
        const oldFilePath = join(uploadsDir, oldFilename);
        const newFilePath = join(profilePicsDir, oldFilename);
        
        // Check if the source file exists
        try {
          await access(oldFilePath, constants.F_OK);
        } catch (err) {
          console.error(`File not found: ${oldFilePath}`);
          results.errors.push(`File not found: ${oldFilename}`);
          results.failed++;
          continue;
        }
        
        // Move the file to the new directory
        await rename(oldFilePath, newFilePath);
        
        // Update the user record in the database
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: `/uploads/profile-pictures/${oldFilename}` }
        });
        
        console.log(`Migrated avatar for user ${user.id}: ${oldFilename}`);
        results.success++;
      } catch (error) {
        console.error(`Failed to migrate avatar for user ${user.id}:`, error);
        results.errors.push(`Error for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`);
        results.failed++;
      }
    }
    
    // Also check for orphaned files in the uploads directory
    // These are files that match the pattern but aren't associated with any user
    try {
      const files = await readdir(uploadsDir);
      
      // Get files that match the user ID pattern (they're likely profile pictures)
      // The pattern is: {userId}-{timestamp}.{extension}
      for (const file of files) {
        if (!/^cm\w+-\d+\.\w+$/.test(file)) continue;
        
        // Skip directories and files that aren't avatar format
        try {
          await access(join(uploadsDir, file), constants.F_OK);
          
          // Move this file to the profile pictures directory
          try {
            await rename(
              join(uploadsDir, file),
              join(profilePicsDir, file)
            );
            console.log(`Moved orphaned file: ${file}`);
            results.success++;
          } catch (error) {
            console.error(`Failed to move orphaned file ${file}:`, error);
            results.errors.push(`Error moving orphaned file ${file}: ${error instanceof Error ? error.message : String(error)}`);
            results.failed++;
          }
        } catch (error) {
          // File doesn't exist or can't be accessed
          results.skipped++;
        }
      }
    } catch (error) {
      console.error('Error checking for orphaned files:', error);
      results.errors.push(`Error checking for orphaned files: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Return success response with migration results
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to migrate profile pictures',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 