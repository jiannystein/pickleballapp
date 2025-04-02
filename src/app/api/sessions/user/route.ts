import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Define types for our session data
interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface SessionLocation {
  id: string;
  name: string;
  address: string;
  instructions: string | null;
  photoUrl: string | null;
}

interface RawSessionData {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  duration: number;
  maxPlayers: number;
  status: string;
  lookingForPlayers: boolean;
  lookingForTeams: boolean;
  price: number | null;
  paymentMethod: string | null;
  contactInfo: string | null;
  isPrivate: boolean;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorAvatarUrl: string | null;
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationInstructions: string | null;
  locationPhotoUrl: string | null;
  players: SessionUser[];
}

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
      SELECT "A"::text FROM "_SessionPlayers" WHERE "B" = ${user.userId}::text
    `;

    // Format the IDs into an array
    const playerSessionIds = Array.isArray(joinedSessionIds) 
      ? joinedSessionIds.map(row => row.A)
      : [];

    // Get sessions created by the user
    const createdSessionIds = await prisma.$queryRaw`
      SELECT id::text FROM "Session" WHERE "creatorId" = ${user.userId}::text
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

    // Handle each ID separately in the query to avoid SQL injection and formatting issues
    const sessionsPromises = allUserSessionIds.map(async (sessionId) => {
      const sessionData = await prisma.$queryRaw<RawSessionData[]>`
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
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', u.id, 
              'name', u.name, 
              'email', u.email, 
              'avatarUrl', u."avatarUrl"
            ))
            FROM "_SessionPlayers" js
            JOIN "User" u ON js."B"::text = u.id::text
            WHERE js."A"::text = s.id::text
            ), '[]'::json
          ) as players
        FROM "Session" s
        JOIN "User" c ON s."creatorId"::text = c.id::text
        JOIN "Location" l ON s."locationId"::text = l.id::text
        WHERE s.id::text = ${sessionId}::text
      `;
      
      return sessionData[0]; // Get the first (and only) result
    });

    // Wait for all queries to complete
    const userSessions = await Promise.all(sessionsPromises);

    // Sort sessions by date
    userSessions.sort((a: RawSessionData, b: RawSessionData) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Transform the raw data into the expected format
    const formattedSessions = userSessions.map((session: RawSessionData) => ({
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

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 