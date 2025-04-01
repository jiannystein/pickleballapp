import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * API endpoint to update avatar URLs in the database to point to the new profile-pictures folder
 * GET /api/profile/update-avatar-urls
 */
export async function GET(request: Request) {
  try {
    // Only allow admins to run this
    const user = await getUser(request as any);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting update of avatar URLs in the database...');
    
    // Get all users with profile pictures that still point to the root uploads folder
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

    console.log(`Found ${users.length} users with avatars to update.`);
    
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // Process each user's avatar URL
    for (const user of users) {
      try {
        if (!user.avatarUrl) continue;
        
        // Extract the filename from the URL
        const filename = user.avatarUrl.replace('/uploads/', '');
        const newAvatarUrl = `/uploads/profile-pictures/${filename}`;
        
        // Update the user record in the database
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: newAvatarUrl }
        });
        
        console.log(`Updated avatar URL for user ${user.id}: ${newAvatarUrl}`);
        results.updated++;
      } catch (error) {
        console.error(`Failed to update avatar URL for user ${user.id}:`, error);
        results.errors.push(`Error for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`);
        results.failed++;
      }
    }
    
    // Return success response with update results
    return NextResponse.json({
      success: true,
      message: 'Avatar URL updates completed',
      results
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update avatar URLs',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 