import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { uploadFile, deleteFile } from '@/lib/file-utils';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request as any);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can upload location photos
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can upload location photos' },
        { status: 403 }
      );
    }

    const locationId = params.id;

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, photoUrl: true }
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
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

    // Delete previous photo if it exists
    if (location.photoUrl) {
      await deleteFile(location.photoUrl);
    }

    // Upload new photo
    const photoUrl = await uploadFile(file, 'uploads/locations', `location-${locationId}`);

    // Update location's photo URL in database
    await prisma.location.update({
      where: { id: locationId },
      data: { photoUrl }
    });

    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error('Location photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload location photo' },
      { status: 500 }
    );
  }
} 