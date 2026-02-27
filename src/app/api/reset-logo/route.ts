import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST() {
  try {
    // Verify that the user is an admin
    const token = await verifyAuth();
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default values for logo and favicon
    const defaultLogo = '/uploads/logo/default-logo.png';
    const defaultFavicon = '/uploads/logo/default-favicon.ico';

    // Reset logo
    const existingLogoEntry = await prisma.$queryRaw<any[]>`
      SELECT id FROM "SiteConfig" WHERE key = 'logo'
    `;

    if (existingLogoEntry.length > 0) {
      // Update existing logo entry
      await prisma.$executeRaw`
        UPDATE "SiteConfig" SET value = ${defaultLogo}, "updatedAt" = NOW() 
        WHERE key = 'logo'
      `;
    } else {
      // Create new logo entry
      await prisma.$executeRaw`
        INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'logo', ${defaultLogo}, NOW(), NOW())
      `;
    }

    // Reset favicon
    const existingFaviconEntry = await prisma.$queryRaw<any[]>`
      SELECT id FROM "SiteConfig" WHERE key = 'favicon'
    `;

    if (existingFaviconEntry.length > 0) {
      // Update existing favicon entry
      await prisma.$executeRaw`
        UPDATE "SiteConfig" SET value = ${defaultFavicon}, "updatedAt" = NOW() 
        WHERE key = 'favicon'
      `;
    } else {
      // Create new favicon entry
      await prisma.$executeRaw`
        INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'favicon', ${defaultFavicon}, NOW(), NOW())
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Logo and favicon reset to default values'
    });

  } catch (error) {
    console.error('Error resetting logo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 