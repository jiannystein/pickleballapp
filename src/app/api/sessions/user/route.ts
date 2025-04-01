import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    
    if (!user?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get IDs of sessions where the user is a player
    const joinedSessionIds = await prisma.$queryRaw`
      SELECT "A" FROM "_SessionPlayers" WHERE "B" = ${user.userId}
    `;

    // Format the IDs into an array
    const playerSessionIds = Array.isArray(joinedSessionIds) 
      ? joinedSessionIds.map(row => row.A)
      : [];

    // Get sessions created by the user
    const createdSessionIds = await prisma.$queryRaw`
      SELECT id FROM "Session" WHERE "creatorId" = ${user.userId}
    `;

    // Format the created session IDs into an array
    const creatorSessionIds = Array.isArray(createdSessionIds) 
      ? createdSessionIds.map(row => row.id)
      : [];

    // Combine unique IDs from both arrays
    const allUserSessionIds = [...playerSessionIds, ...creatorSessionIds].filter((id, index, self) => 
      self.indexOf(id) === index
    );

    // If no sessions found, return empty array
    if (allUserSessionIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all relevant sessions (both created and joined)
    const userSessions = await prisma.$queryRaw`
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
        WHERE s.id IN (${Prisma.join(allUserSessionIds)})
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

    // Transform the raw data into the expected format
    const formattedSessions = (userSessions as any[]).map((session: any) => ({
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
      isPrivate: session.isPrivate,
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

    // Check for specific session ID
    const hasTargetSession = formattedSessions.some(s => s.id === 'cm8v69h1c0001760k7ohv2tut');
    console.log('Has target session cm8v69h1c0001760k7ohv2tut:', hasTargetSession);
    
    if (hasTargetSession) {
      const targetSession = formattedSessions.find(s => s.id === 'cm8v69h1c0001760k7ohv2tut');
      console.log('Target session details:', {
        id: targetSession?.id,
        title: targetSession?.title,
        status: targetSession?.status,
        players: targetSession?.players.map(p => p.id)
      });
    }

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 