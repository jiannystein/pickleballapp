import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

/**
 * Helper function to clean up orphaned session photos
 * Identifies files that don't correspond to any photo in the database
 */
async function cleanupOrphanedSessionPhotos() {
  try {
    console.log('Checking for orphaned session photos...');
    const sessionsUploadDir = join(process.cwd(), 'public', 'uploads', 'sessions');
    
    // Read all files in the sessions directory
    const files = await readdir(sessionsUploadDir);
    
    // Get all session photos from the database
    const photos = await prisma.sessionPhoto.findMany({
      select: {
        photoUrl: true
      }
    });
    
    // Create a set of valid filenames from photo URLs
    const validFilenames = new Set();
    photos.forEach(photo => {
      if (photo.photoUrl && photo.photoUrl.startsWith('/uploads/sessions/')) {
        const filename = photo.photoUrl.replace('/uploads/sessions/', '');
        validFilenames.add(filename);
      }
    });
    
    let orphanedCount = 0;
    
    // Check each file if it's referenced in the database
    for (const file of files) {
      if (!validFilenames.has(file)) {
        // Check if the file is older than 1 day (86400000 ms)
        try {
          const filePath = join(sessionsUploadDir, file);
          const fileStats = await stat(filePath);
          const fileAge = Date.now() - fileStats.mtimeMs;
          
          // Only delete files older than 1 day to avoid race conditions with new uploads
          if (fileAge > 86400000) {
            await unlink(filePath);
            console.log(`Deleted orphaned session photo: ${file}`);
            orphanedCount++;
          }
        } catch (error) {
          console.error(`Failed to delete orphaned session photo ${file}:`, error);
        }
      }
    }
    
    console.log(`Orphaned session photos cleanup complete. Removed ${orphanedCount} orphaned photos.`);
    return orphanedCount;
  } catch (error) {
    console.error('Error during orphaned session photos cleanup:', error);
    return 0;
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting photo upload process for session:', params.id);
    const user = await getUser(request as any);
    if (!user) {
      console.error('Authentication failed: No user found in request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Authenticated user:', user.userId, user.name);

    const sessionId = params.id;
    console.log('Processing photo upload for session:', sessionId);

    // Check if session exists - use direct query
    console.log('Verifying session existence and user participation');
    const session = await prisma.$queryRaw`
      SELECT s.*, json_agg(u) as players
      FROM "Session" s
      JOIN "User" c ON s."creatorId" = c.id
      JOIN "Location" l ON s."locationId" = l.id
      LEFT JOIN "_SessionPlayers" js ON s.id = js."A"
      LEFT JOIN "User" u ON js."B" = u.id
      WHERE s.id = ${sessionId}
      AND (s."creatorId" = ${user.userId} OR js."B" = ${user.userId})
      GROUP BY s.id
    `;
    console.log('Session query result:', session ? 'Session found' : 'Session not found');

    if (!session || (Array.isArray(session) && session.length === 0)) {
      console.error('Session not found or user not authorized to upload photos for this session');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = Array.isArray(session) ? session[0] : session;
    
    // Only players who have joined the session or the creator can upload photos
    const isCreator = sessionData.creatorId === user.userId;
    const players = sessionData.players || [];
    const isPlayer = players.some((player: any) => player.id === user.userId);
    console.log('User participation check:', { isCreator, isPlayer, playerCount: players.length });
    
    if (!isCreator && !isPlayer) {
      console.error('Permission denied: User is neither creator nor participant');
      return NextResponse.json(
        { error: 'Only session participants can upload photos' },
        { status: 403 }
      );
    }

    console.log('Processing uploaded file');
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const caption = formData.get('caption') as string || '';
    
    if (!file) {
      console.error('No file found in form data');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    console.log('File received:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `session-${sessionId}-${user.userId}-${timestamp}.${extension}`;
    console.log('Generated filename:', filename);

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'sessions');
    console.log('Upload directory:', uploadDir);
    try {
      console.log('Creating directory if it doesn\'t exist');
      await mkdir(uploadDir, { recursive: true });
      
      console.log('Converting file to buffer');
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log('Buffer created, length:', buffer.length);
      
      console.log('Writing file to disk');
      await writeFile(join(uploadDir, filename), buffer);
      console.log('File written successfully');
    } catch (error: any) {
      console.error('File write error:', error);
      return NextResponse.json(
        { error: `Failed to save file: ${error.message}` },
        { status: 500 }
      );
    }

    // Create a new session photo in the database - use direct query
    const photoUrl = `/uploads/sessions/${filename}`;
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    console.log('Inserting photo record in database with ID:', photoId);
    
    try {
      await prisma.$executeRaw`
        INSERT INTO "SessionPhoto" (id, "photoUrl", caption, "sessionId", "userId", "createdAt")
        VALUES (${photoId}, ${photoUrl}, ${caption}, ${sessionId}, ${user.userId}, ${new Date()})
      `;
      console.log('Photo record inserted successfully');
    } catch (dbError: any) {
      console.error('Database error during photo insertion:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Fetch the newly created photo
    console.log('Fetching the newly created photo');
    let newPhoto;
    try {
      newPhoto = await prisma.$queryRaw`
        SELECT p.*, json_build_object('id', u.id, 'name', u.name, 'avatarUrl', u."avatarUrl") as "uploadedBy"
        FROM "SessionPhoto" p
        JOIN "User" u ON p."userId" = u.id
        WHERE p.id = ${photoId}
      `;
      console.log('Photo fetched successfully');
    } catch (fetchError) {
      console.error('Error fetching new photo:', fetchError);
      // Continue anyway since the photo was uploaded already
      newPhoto = {
        id: photoId,
        photoUrl: photoUrl,
        caption: caption,
        createdAt: new Date(),
        uploadedBy: {
          id: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl
        }
      };
    }

    // Run orphaned photos cleanup as a background task
    cleanupOrphanedSessionPhotos().catch(error => {
      console.error('Background cleanup error:', error);
    });

    console.log('Photo upload completed successfully');
    return NextResponse.json(Array.isArray(newPhoto) ? newPhoto[0] : newPhoto);
  } catch (error: any) {
    console.error('Session photo upload error:', error);
    return NextResponse.json(
      { error: `Failed to upload session photo: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Check if session exists - use direct query
    const session = await prisma.$queryRaw`
      SELECT * FROM "Session" WHERE id = ${sessionId}
    `;

    if (!session || (Array.isArray(session) && session.length === 0)) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get all photos for the session - use direct query
    const photos = await prisma.$queryRaw`
      SELECT p.*, json_build_object('id', u.id, 'name', u.name, 'avatarUrl', u."avatarUrl") as "uploadedBy"
      FROM "SessionPhoto" p
      JOIN "User" u ON p."userId" = u.id
      WHERE p."sessionId" = ${sessionId}
      ORDER BY p."createdAt" DESC
    `;

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Error fetching session photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session photos' },
      { status: 500 }
    );
  }
} 