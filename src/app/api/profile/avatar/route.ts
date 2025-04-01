import { NextResponse } from 'next/server';
import { getUser, signJWT } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, readdir, rename, unlink } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cookies } from 'next/headers';
import { existsSync } from 'fs';
import { stat } from 'fs/promises';

/**
 * Helper function to move existing profile pictures to the profile-pictures folder
 * This runs only once to migrate existing avatars
 */
async function migrateExistingProfilePictures() {
  try {
    console.log('Checking for profile pictures to migrate...');
    // Ensure profile pictures directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const profilePicsDir = join(uploadsDir, 'profile-pictures');
    
    await mkdir(profilePicsDir, { recursive: true });
    
    // Read all files in the uploads directory
    const files = await readdir(uploadsDir);
    let migratedCount = 0;
    
    // Identify files that match the user ID pattern (they're likely profile pictures)
    // The pattern is: {userId}-{timestamp}.{extension}
    for (const file of files) {
      // Skip directories
      if (existsSync(join(uploadsDir, file)) && !file.includes('.')) continue;
      
      // Check if this is likely a profile picture by matching the pattern
      if (/^cm\w+-\d+\.\w+$/.test(file)) {
        console.log(`Found likely profile picture: ${file}`);
        
        // Move the file to the profile-pictures directory
        try {
          await rename(
            join(uploadsDir, file),
            join(profilePicsDir, file)
          );
          migratedCount++;
          
          // Update the user's avatarUrl in the database
          const userId = file.split('-')[0];
          
          // Only update if the old URL matches this file
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true }
          });
          
          if (user && user.avatarUrl === `/uploads/${file}`) {
            await prisma.user.update({
              where: { id: userId },
              data: { avatarUrl: `/uploads/profile-pictures/${file}` }
            });
            console.log(`Updated avatar URL for user ${userId}`);
          }
        } catch (error) {
          console.error(`Failed to migrate file ${file}:`, error);
        }
      }
    }
    
    console.log(`Migration complete. Migrated ${migratedCount} profile pictures.`);
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

/**
 * Helper function to clean up old profile pictures for a user
 * This removes all previous profile pictures for a user except the most recent one
 */
async function cleanupOldProfilePictures(userId: string, currentFilename: string) {
  try {
    console.log(`Cleaning up old profile pictures for user: ${userId}`);
    const profilePicsDir = join(process.cwd(), 'public', 'uploads', 'profile-pictures');
    
    // Read all files in the profile pictures directory
    const files = await readdir(profilePicsDir);
    let removedCount = 0;
    
    // Find files that belong to this user
    const userFiles = files.filter(file => {
      // Match the pattern: {userId}-{timestamp}.{extension}
      return file.startsWith(`${userId}-`) && file !== currentFilename;
    });
    
    console.log(`Found ${userFiles.length} old profile pictures for user ${userId}`);
    
    // Delete old files
    for (const file of userFiles) {
      try {
        const filePath = join(profilePicsDir, file);
        await unlink(filePath);
        console.log(`Deleted old profile picture: ${file}`);
        removedCount++;
      } catch (error) {
        console.error(`Failed to delete old profile picture ${file}:`, error);
      }
    }
    
    console.log(`Cleanup complete. Removed ${removedCount} old profile pictures.`);
    
    // Also check for orphaned files
    await cleanupOrphanedProfilePictures();
  } catch (error) {
    console.error('Error during profile picture cleanup:', error);
  }
}

/**
 * Helper function to clean up orphaned profile pictures
 * Identifies files that don't correspond to any user in the database
 */
async function cleanupOrphanedProfilePictures() {
  try {
    console.log('Checking for orphaned profile pictures...');
    const profilePicsDir = join(process.cwd(), 'public', 'uploads', 'profile-pictures');
    
    // Read all files in the profile pictures directory
    const files = await readdir(profilePicsDir);
    
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
    
    // Create a set of valid filenames from user avatarUrls
    const validFilenames = new Set();
    users.forEach(user => {
      if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/profile-pictures/')) {
        const filename = user.avatarUrl.replace('/uploads/profile-pictures/', '');
        validFilenames.add(filename);
      }
    });
    
    let orphanedCount = 0;
    
    // Check each file if it's referenced by a user
    for (const file of files) {
      if (!validFilenames.has(file)) {
        // Check if the file is older than 1 day (86400000 ms)
        try {
          const filePath = join(profilePicsDir, file);
          const fileStats = await stat(filePath);
          const fileAge = Date.now() - fileStats.mtimeMs;
          
          // Only delete files older than 1 day to avoid race conditions with new uploads
          if (fileAge > 86400000) {
            await unlink(filePath);
            console.log(`Deleted orphaned profile picture: ${file}`);
            orphanedCount++;
          }
        } catch (error) {
          console.error(`Failed to delete orphaned profile picture ${file}:`, error);
        }
      }
    }
    
    console.log(`Orphaned file cleanup complete. Removed ${orphanedCount} orphaned profile pictures.`);
  } catch (error) {
    console.error('Error during orphaned profile picture cleanup:', error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request as any);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Processing avatar upload for user:', user.userId);

    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${user.userId}-${timestamp}.${extension}`;

    // Ensure profile pictures directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profile-pictures');
    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
      console.log('Avatar file saved as:', filename);
      
      // Try to migrate existing profile pictures
      await migrateExistingProfilePictures();
    } catch (error) {
      console.error('File write error:', error);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      );
    }

    // Update user's avatar URL in database
    const avatarUrl = `/uploads/profile-pictures/${filename}`;
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.userId },
        data: { avatarUrl },
      });
      
      console.log('User updated in database with new avatar URL:', avatarUrl);
      console.log('Updated user data:', updatedUser);
      
      // Update the JWT token with the new avatar URL
      console.log('Creating new JWT with avatar URL:', avatarUrl);
      const newToken = await signJWT({
        userId: user.userId,
        email: user.email,
        name: user.name,
        avatarUrl, // This is the updated avatar URL
        isAdmin: user.isAdmin
      });
      
      // Set the new cookie
      cookies().set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400 // 24 hours
      });
      
      console.log('JWT token updated with new avatar URL');
      
      // Clean up old profile pictures in the background
      // We don't await this so it doesn't block the response
      cleanupOldProfilePictures(user.userId, filename).catch(error => {
        console.error('Background cleanup error:', error);
      });
      
      return NextResponse.json({ 
        avatarUrl,
        success: true,
        message: 'Avatar updated successfully'
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
} 