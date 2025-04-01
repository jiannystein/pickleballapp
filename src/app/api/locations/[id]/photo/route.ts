import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

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

    // Check if location exists - use direct query
    const location = await prisma.$queryRaw`
      SELECT * FROM "Location" WHERE id = ${locationId}
    `;

    if (!location || (Array.isArray(location) && location.length === 0)) {
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

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `location-${locationId}-${timestamp}.${extension}`;

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'locations');
    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
    } catch (error) {
      console.error('File write error:', error);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      );
    }

    // Update location's photo URL in database - use direct query
    const photoUrl = `/uploads/locations/${filename}`;
    await prisma.$executeRaw`
      UPDATE "Location" SET "photoUrl" = ${photoUrl} WHERE id = ${locationId}
    `;

    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error('Location photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload location photo' },
      { status: 500 }
    );
  }
} 