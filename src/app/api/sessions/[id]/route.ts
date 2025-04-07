import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// GET - Retrieve a specific session by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Use raw query to get session data
    const result = await prisma.$queryRaw`
      SELECT 
        s.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'avatarUrl', c."avatarUrl"
        ) as creator,
        json_build_object(
          'id', l.id,
          'name', l.name,
          'address', l.address,
          'instructions', l.instructions,
          'photoUrl', l."photoUrl"
        ) as location,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', u.id, 
            'name', u.name, 
            'email', u.email, 
            'avatarUrl', u."avatarUrl"
          ))
          FROM "_SessionPlayers" js
          JOIN "User" u ON js."B" = u.id
          WHERE js."A" = s.id
          ), '[]'::json
        ) as players
      FROM "Session" s
      JOIN "User" c ON s."creatorId" = c.id
      JOIN "Location" l ON s."locationId" = l.id
      WHERE s.id = ${sessionId}
    `;

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // If result is an array, return the first item
    const session = Array.isArray(result) ? result[0] : result;
    
    // Create response with cache headers
    const response = NextResponse.json(session);
    
    // If the session is in the past or completed, we can cache it longer
    const sessionDate = new Date(session.date);
    const now = new Date();
    const isCompleted = session.status === 'completed';
    const isPastSession = sessionDate < now;
    
    if (isCompleted || isPastSession) {
      // Cache completed or past sessions for longer (1 hour)
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    } else {
      // For active sessions, use a shorter cache time (5 minutes)
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    }
    
    return response;
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'An error occurred while retrieving the session' },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = await request.json();

    // Verify session exists and user is the creator - use raw query
    const existingSession = await prisma.$queryRaw`
      SELECT s.*, c.id as "creatorId" 
      FROM "Session" s
      JOIN "User" c ON s."creatorId" = c.id
      WHERE s.id = ${sessionId}
    `;

    if (!existingSession || (Array.isArray(existingSession) && existingSession.length === 0)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = Array.isArray(existingSession) ? existingSession[0] : existingSession;
    if (session.creatorId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized: Only the creator can update this session' }, { status: 403 });
    }

    // Validate required fields
    if (!sessionData.title || !sessionData.locationId || !sessionData.date) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Verify the location exists - use raw query
    const location = await prisma.$queryRaw`
      SELECT * FROM "Location" WHERE id = ${sessionData.locationId}
    `;

    if (!location || (Array.isArray(location) && location.length === 0)) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 400 }
      );
    }

    // Update the session - use raw query
    const sessionDate = new Date(sessionData.date);
    
    // Store the date in UTC format to avoid timezone issues
    await prisma.$executeRaw`
      UPDATE "Session" 
      SET 
        title = ${sessionData.title},
        "locationId" = ${sessionData.locationId},
        date = ${sessionDate},
        "maxPlayers" = ${sessionData.maxPlayers},
        duration = ${sessionData.duration},
        "lookingForPlayers" = ${sessionData.lookingForPlayers},
        "lookingForTeams" = ${sessionData.lookingForTeams},
        price = ${sessionData.price || null},
        "paymentMethod" = ${sessionData.paymentMethod || null},
        "contactInfo" = ${sessionData.contactInfo || null},
        status = ${sessionData.status || 'active'},
        "updatedAt" = ${new Date()}
      WHERE id = ${sessionId}
    `;

    // Get updated session with all related data
    const updatedResult = await prisma.$queryRaw`
      SELECT 
        s.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'avatarUrl', c."avatarUrl"
        ) as creator,
        json_build_object(
          'id', l.id,
          'name', l.name,
          'address', l.address,
          'instructions', l.instructions,
          'photoUrl', l."photoUrl"
        ) as location,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', u.id, 
            'name', u.name, 
            'email', u.email, 
            'avatarUrl', u."avatarUrl"
          ))
          FROM "_SessionPlayers" js
          JOIN "User" u ON js."B" = u.id
          WHERE js."A" = s.id
          ), '[]'::json
        ) as players
      FROM "Session" s
      JOIN "User" c ON s."creatorId" = c.id
      JOIN "Location" l ON s."locationId" = l.id
      WHERE s.id = ${sessionId}
    `;

    const updatedSession = Array.isArray(updatedResult) ? updatedResult[0] : updatedResult;
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the session' },
      { status: 500 }
    );
  }
} 