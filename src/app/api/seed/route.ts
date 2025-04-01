import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

const DEFAULT_SITE_CONFIG = {
  siteName: 'PickleBall',
  tagline: 'Connect with fellow pickleball players and join sessions',
  facebook: 'https://facebook.com/pickleball',
  twitter: 'https://twitter.com/pickleball',
  instagram: 'https://instagram.com/pickleball',
  youtube: 'https://youtube.com/pickleball',
  address: '123 Pickleball Court, Paddle City, PC 12345',
  phone: '(555) 123-4567',
  email: 'info@pickleballapp.com',
  copyright: `© ${new Date().getFullYear()} PickleBall. All rights reserved.`,
  primaryColor: '#6366f1',
  logo: '/logo.png'
};

export async function GET(request: NextRequest) {
  try {
    // Check if admin user exists
    const adminCount = await prisma.user.count({
      where: {
        isAdmin: true
      }
    });

    if (adminCount === 0) {
      // Create admin user if none exists
      const hashedPassword = await hash('adminpass123', 10);
      
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          isAdmin: true
        }
      });
      
      console.log('Created admin user');
    }

    // Initialize site configuration
    const defaultConfig = {
      siteName: 'PickleBall',
      tagline: 'Connect with fellow pickleball players and join sessions',
      primaryColor: '#4f46e5',
      secondaryColor: '#3b82f6',
      facebookUrl: 'https://facebook.com',
      twitterUrl: 'https://twitter.com',
      instagramUrl: 'https://instagram.com',
      youtubeUrl: 'https://youtube.com',
      address: '123 Main St, Anytown, USA',
      phone: '(555) 123-4567',
      email: 'contact@pickleball.com',
      copyrightText: `© ${new Date().getFullYear()} PickleBall. All rights reserved.`
    };

    // Use raw SQL to handle site config entries
    for (const [key, value] of Object.entries(defaultConfig)) {
      // Check if the config exists
      const existingConfig = await prisma.$queryRaw`
        SELECT * FROM SiteConfig WHERE key = ${key} LIMIT 1
      `;

      if (Array.isArray(existingConfig) && existingConfig.length > 0) {
        // Update existing config
        await prisma.$executeRaw`
          UPDATE SiteConfig
          SET value = ${value}, updatedAt = ${new Date()}
          WHERE key = ${key}
        `;
      } else {
        // Insert new config
        await prisma.$executeRaw`
          INSERT INTO SiteConfig (id, key, value, createdAt, updatedAt)
          VALUES (${crypto.randomUUID()}, ${key}, ${value}, ${new Date()}, ${new Date()})
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with admin user and site configuration"
    });

  } catch (error) {
    console.error('Seed operation failed:', error);
    return NextResponse.json({ error: 'Seed operation failed' }, { status: 500 });
  }
} 