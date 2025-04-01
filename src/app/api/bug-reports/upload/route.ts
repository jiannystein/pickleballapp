import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getUser } from '@/lib/auth';

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/bug-reports/upload
 * Upload an image for a bug report
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUser(request);
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 5MB limit' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // Create a buffer from the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bug-reports');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename with timestamp and user ID
    const timestamp = Date.now();
    const fileName = `bug_report_${timestamp}_${user.userId.substring(0, 8)}.${file.name.split('.').pop()}`;
    const filePath = path.join(uploadDir, fileName);

    // Write the file to the server
    await writeFile(filePath, buffer);

    // Return the relative path to the client
    const publicPath = `/uploads/bug-reports/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      filePath: publicPath,
      fileName: fileName,
      fileSize: file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// NextJS configuration for API routes
export const config = {
  api: {
    bodyParser: false,
  },
}; 