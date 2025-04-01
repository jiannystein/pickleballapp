import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { logUserActivity, ActivityType } from '@/lib/activity';

// Get all sessions
export async function GET(request: NextRequest) {
  try {
    // Get current user if logged in
    let currentUserId = null;
    try {
      const user = await getUser(request);
      if (user?.userId) {
        currentUserId = user.userId;
      }
    } catch (error) {
      // Continue without user context
      console.log('No authenticated user found for session filtering');
    }

    // Fetch sessions with different filters based on authentication
    let sessions;
    
    if (currentUserId) {
      // User is logged in, include their own cancelled sessions
      sessions = await prisma.$queryRaw`
        WITH session_data AS (
          SELECT 
            s.*,
            c.id as "creatorId", 
            c.name as "creatorName", 
            c.email as "creatorEmail", 
            c."avatarUrl" as "creatorAvatarUrl",
            l.id as "locationId", 
            l.name as "locationName", 
            l.address as "locationAddress", 
            l.instructions as "locationInstructions",
            l."photoUrl" as "locationPhotoUrl",
            CASE WHEN s."creatorId" = ${currentUserId} THEN true ELSE false END as "isCreator"
          FROM "Session" s
          JOIN "User" c ON s."creatorId" = c.id
          JOIN "Location" l ON s."locationId" = l.id
          WHERE s.status = 'active' OR s."creatorId" = ${currentUserId}
          ORDER BY s.date ASC
        )
        SELECT 
          sd.*,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', u.id, 
              'name', u.name, 
              'email', u.email, 
              'avatarUrl', u."avatarUrl"
            ))
            FROM "_SessionPlayers" js
            JOIN "User" u ON js."B" = u.id
            WHERE js."A" = sd.id
            ), '[]'::json
          ) as players
        FROM session_data sd
      `;
    } else {
      // No logged in user, only show active sessions
      sessions = await prisma.$queryRaw`
        WITH session_data AS (
          SELECT 
            s.*,
            c.id as "creatorId", 
            c.name as "creatorName", 
            c.email as "creatorEmail", 
            c."avatarUrl" as "creatorAvatarUrl",
            l.id as "locationId", 
            l.name as "locationName", 
            l.address as "locationAddress", 
            l.instructions as "locationInstructions",
            l."photoUrl" as "locationPhotoUrl"
          FROM "Session" s
          JOIN "User" c ON s."creatorId" = c.id
          JOIN "Location" l ON s."locationId" = l.id
          WHERE s.status = 'active'
          ORDER BY s.date ASC
        )
        SELECT 
          sd.*,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', u.id, 
              'name', u.name, 
              'email', u.email, 
              'avatarUrl', u."avatarUrl"
            ))
            FROM "_SessionPlayers" js
            JOIN "User" u ON js."B" = u.id
            WHERE js."A" = sd.id
            ), '[]'::json
          ) as players
        FROM session_data sd
      `;
    }

    // Transform the raw data into the expected format
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      date: session.date,
      duration: session.duration,
      maxPlayers: session.maxPlayers,
      status: session.status,
      lookingForPlayers: session.lookingForPlayers,
      lookingForTeams: session.lookingForTeams,
      price: session.price,
      paymentMethod: session.paymentMethod,
      contactInfo: session.contactInfo,
      isPrivate: session.isPrivate || false,
      creator: {
        id: session.creatorId,
        name: session.creatorName,
        email: session.creatorEmail,
        avatarUrl: session.creatorAvatarUrl
      },
      location: {
        id: session.locationId,
        name: session.locationName,
        address: session.locationAddress,
        instructions: session.locationInstructions,
        photoUrl: session.locationPhotoUrl
      },
      players: session.players || []
    }));

    // After fetching sessions
    // Add pending request counts for sessions where the user is the host
    const sessionsWithRequestCounts = await Promise.all(
      formattedSessions.map(async (session: any) => {
        // Only count pending requests for sessions where the current user is the host
        if (session.creator.id === currentUserId) {
          try {
            // Count pending requests for this session
            const pendingRequests = await (prisma as any).joinRequest.count({
              where: {
                sessionId: session.id,
                status: 'pending'
              }
            });
            
            // Only add the count if there are actually pending requests
            if (pendingRequests > 0) {
              return {
                ...session,
                pendingRequestsCount: pendingRequests
              };
            }
          } catch (err) {
            console.error(`Error counting pending requests for session ${session.id}:`, err);
          }
        }
        return session;
      })
    );

    return NextResponse.json(sessionsWithRequestCounts);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new session
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    
    if (!user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      title, 
      description, 
      locationId, 
      date, 
      maxPlayers, 
      duration,
      lookingForPlayers,
      lookingForTeams,
      price,
      paymentMethod,
      contactInfo,
      isPrivate
    } = await request.json();

    // Validate input
    if (!title || !locationId || !date || !maxPlayers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the location exists - use direct query
    const location = await prisma.$queryRaw`
      SELECT * FROM "Location" WHERE id = ${locationId}
    `;

    if (!location || (Array.isArray(location) && location.length === 0)) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    try {
      // Create the session with proper relations - use direct query
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const sessionDate = new Date(date);
      const sessionMaxPlayers = parseInt(maxPlayers);
      const sessionDuration = duration ? parseInt(duration) : 60;
      const sessionLookingForPlayers = lookingForPlayers ? true : false;
      const sessionLookingForTeams = lookingForTeams ? true : false;
      const sessionIsPrivate = isPrivate ? true : false;
      
      await prisma.$executeRaw`
        INSERT INTO "Session" (
          id, title, description, "locationId", date, 
          "maxPlayers", duration, "lookingForPlayers", "lookingForTeams",
          price, "paymentMethod", "contactInfo", "creatorId", status, "isPrivate", "createdAt", "updatedAt"
        )
        VALUES (
          ${sessionId}, ${title}, ${description || null}, ${locationId}, ${sessionDate},
          ${sessionMaxPlayers}, ${sessionDuration}, ${sessionLookingForPlayers}, ${sessionLookingForTeams},
          ${price || null}, ${paymentMethod || null}, ${contactInfo || null}, ${user.userId}, 'active', ${sessionIsPrivate},
          ${new Date()}, ${new Date()}
        )
      `;

      // Log the session creation activity
      await logUserActivity(user.userId, ActivityType.CREATE_SESSION, request);

      // Get the created session with related data
      const newSession = await prisma.$queryRaw`
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
          '[]'::json as players
        FROM "Session" s
        JOIN "User" c ON s."creatorId" = c.id
        JOIN "Location" l ON s."locationId" = l.id
        WHERE s.id = ${sessionId}
      `;

      return NextResponse.json(
        Array.isArray(newSession) ? newSession[0] : newSession, 
        { status: 201 }
      );
    } catch (err) {
      console.error('Database error when creating session:', err);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 