import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify that the user is an admin
    const token = await verifyAuth();
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check if the file is a PNG
    if (!file.type.includes('image/png')) {
      return NextResponse.json({ error: 'Only PNG files are allowed' }, { status: 400 });
    }

    // Create a unique filename
    const uniqueId = uuidv4();
    const fileName = `logo-${uniqueId}.png`;
    const iconName = `favicon-${uniqueId}.ico`;
    
    // Get file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logo');
    await ensureDirectoryExists(uploadDir);

    // Save the PNG file
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // For a simple conversion to .ico, we'll just save the PNG with a different extension
    // In a production app, you'd want to use a proper image conversion library
    // For this example, we'll just copy the PNG as an .ico file
    const iconPath = join(uploadDir, iconName);
    await writeFile(iconPath, buffer);

    // Update the site configuration with the new logo paths
    const logoUrl = `/uploads/logo/${fileName}`;
    const faviconUrl = `/uploads/logo/${iconName}`;

    // Check if the logo key exists in the SiteConfig table
    const existingLogoEntry = await prisma.$queryRaw<any[]>`
      SELECT id FROM "SiteConfig" WHERE key = 'logo'
    `;

    if (existingLogoEntry.length > 0) {
      // Update existing logo entry
      await prisma.$executeRaw`
        UPDATE "SiteConfig" SET value = ${logoUrl}, "updatedAt" = NOW() 
        WHERE key = 'logo'
      `;
    } else {
      // Create new logo entry
      await prisma.$executeRaw`
        INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'logo', ${logoUrl}, NOW(), NOW())
      `;
    }

    // Check if the favicon key exists in the SiteConfig table
    const existingFaviconEntry = await prisma.$queryRaw<any[]>`
      SELECT id FROM "SiteConfig" WHERE key = 'favicon'
    `;

    if (existingFaviconEntry.length > 0) {
      // Update existing favicon entry
      await prisma.$executeRaw`
        UPDATE "SiteConfig" SET value = ${faviconUrl}, "updatedAt" = NOW() 
        WHERE key = 'favicon'
      `;
    } else {
      // Create new favicon entry
      await prisma.$executeRaw`
        INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'favicon', ${faviconUrl}, NOW(), NOW())
      `;
    }

    return NextResponse.json({ 
      success: true, 
      logo: logoUrl,
      favicon: faviconUrl 
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 