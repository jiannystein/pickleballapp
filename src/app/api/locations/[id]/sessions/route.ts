import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locationId = params.id;
    
    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }
    
    // Get current date
    const now = new Date();
    
    // Fetch active sessions for this location that haven't expired yet
    const sessions = await prisma.$queryRaw`
      WITH session_data AS (
        SELECT 
          s.*,
          c.id as "creatorId", 
          c.name as "creatorName", 
          c.email as "creatorEmail", 
          c."avatarUrl" as "creatorAvatarUrl"
        FROM "Session" s
        JOIN "User" c ON s."creatorId" = c.id
        WHERE s."locationId" = ${locationId}
          AND s.status = 'active'
          AND s.date > ${now}
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
    
    // Filter to only include sessions that aren't full
    const availableSessions = (sessions as any[]).filter(session => 
      // Count creator + players against maxPlayers
      (1 + session.players.length) <= session.maxPlayers
    );
    
    // Transform the raw data into the expected format
    const formattedSessions = availableSessions.map(session => ({
      id: session.id,
      title: session.title,
      date: session.date,
      maxPlayers: session.maxPlayers,
      players: session.players || [],
      creator: {
        id: session.creatorId,
        name: session.creatorName,
        email: session.creatorEmail,
        avatarUrl: session.creatorAvatarUrl
      }
    }));
    
    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions by location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 