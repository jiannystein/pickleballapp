import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const locationId = params.id;

    // Check if location exists using raw query
    const location = await prisma.$queryRaw`
      SELECT * FROM "Location" WHERE id = ${locationId}
    `;

    if (!location || (Array.isArray(location) && location.length === 0)) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(Array.isArray(location) ? location[0] : location);
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request as any);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update locations
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update locations' },
        { status: 403 }
      );
    }

    const locationId = params.id;
    const updateData = await request.json();

    // Validate fields
    const validFields = ['name', 'address', 'instructions', 'bookingUrl'];
    const cleanedData: Record<string, string> = {};
    
    for (const field of validFields) {
      if (field in updateData) {
        cleanedData[field] = updateData[field];
      }
    }
    
    if (Object.keys(cleanedData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Update the location using Prisma's built-in methods
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        ...cleanedData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
} 