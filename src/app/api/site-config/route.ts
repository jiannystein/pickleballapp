import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

interface ConfigEntry {
  id: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

// Default configuration values
const DEFAULT_CONFIG = {
  siteName: 'PickleBall',
  tagline: 'Connect with fellow pickleball players and join sessions',
  // Meta information derived from siteName and tagline
  siteTitle: 'PickleBall',
  metaDescription: 'Connect with fellow pickleball players and join sessions',
  facebook: 'https://facebook.com',
  twitter: 'https://twitter.com',
  instagram: 'https://instagram.com',
  youtube: '',
  address: '',
  phone: '',
  email: 'contact@pickleball.com',
  copyright: `© ${new Date().getFullYear()} PickleBall. All rights reserved.`,
  primaryColor: '#6366f1', // indigo
  logo: '/uploads/logo/default-logo.png',
  favicon: '/uploads/logo/default-favicon.ico',
  
  // About page content
  aboutTitle: 'About PickleBall App',
  aboutContent: '<p style="color: inherit;">Welcome to the PickleBall App, the premier platform for connecting pickleball enthusiasts in your area. Our application makes it easy to find games, create sessions, and build a community around the sport we all love.</p><p style="color: inherit;">Whether you\'re a beginner looking to learn or a seasoned player seeking competition, PickleBall App helps you connect with players of all skill levels.</p>',
  mission: '<p style="color: inherit;">Our mission is to grow the sport of pickleball by making it accessible to everyone. We\'re dedicated to building a platform that removes barriers to entry and helps create a vibrant, supportive community of players.</p>',
  vision: '<p style="color: inherit;">We envision a world where anyone can find pickleball partners and games with just a few taps on their phone. Our goal is to be the go-to platform that powers pickleball communities across the globe.</p>',
  teamMembers: JSON.stringify([
    {
      name: 'Jane Smith',
      role: 'Founder & CEO',
      bio: 'Pickleball enthusiast and tech entrepreneur with a passion for building communities.',
      photoUrl: ''
    },
    {
      name: 'John Doe',
      role: 'Head of Community',
      bio: 'Former pickleball instructor now focused on growing our player network.',
      photoUrl: ''
    }
  ]),
  // Features for Why Choose Us section
  features: JSON.stringify([
    {
      title: 'Connect with Players',
      description: 'Find and connect with pickleball enthusiasts of all skill levels in your local community.',
      icon: 'users'
    },
    {
      title: 'Easy Scheduling',
      description: 'Create and join sessions with a few clicks. Manage your pickleball schedule effortlessly.',
      icon: 'calendar'
    },
    {
      title: 'Find Locations',
      description: 'Discover pickleball courts and venues near you with detailed information and directions.',
      icon: 'location'
    }
  ]),
  // Community statistics
  stats: JSON.stringify([
    { value: '500+', label: 'Active Players' },
    { value: '100+', label: 'Weekly Sessions' },
    { value: '50+', label: 'Locations' },
    { value: '15+', label: 'Cities' }
  ])
};

// GET /api/site-config - Get all site configuration
export async function GET() {
  try {
    console.log('Fetching site configuration from database');
    
    // Get all config entries
    const configEntries = await prisma.$queryRaw<ConfigEntry[]>`
      SELECT * FROM "SiteConfig"
    `;
    
    // Convert to key-value object
    const configObject: Record<string, string> = {};
    
    configEntries.forEach((entry: ConfigEntry) => {
      configObject[entry.key] = entry.value;
      console.log(`Config entry: ${entry.key} = ${entry.value}`);
    });
    
    // Special handling for site title
    if (configObject.siteName && !configObject.siteTitle) {
      configObject.siteTitle = configObject.siteName;
      console.log('Setting siteTitle from siteName:', configObject.siteTitle);
    }
    
    // Merge with defaults for any missing values
    const mergedConfig = {
      ...DEFAULT_CONFIG,
      ...configObject,
      // Ensure siteTitle is always set
      siteTitle: configObject.siteTitle || configObject.siteName || DEFAULT_CONFIG.siteName
    };
    
    console.log('Final merged configuration:', {
      siteName: mergedConfig.siteName,
      siteTitle: mergedConfig.siteTitle,
      tagline: mergedConfig.tagline,
      metaDescription: mergedConfig.metaDescription
    });
    
    // Return with no-cache headers
    return new NextResponse(JSON.stringify(mergedConfig), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching site configuration:', error);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

// POST /api/site-config - Update site configuration (admin only)
export async function POST(req: Request) {
  try {
    const token = await verifyAuth();
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    // Create a new object with the updates
    const updates = { ...body };
    
    // Automatically sync site title and meta description
    if (updates.siteName) {
      updates.siteTitle = updates.siteName;
    }
    
    if (updates.tagline) {
      updates.metaDescription = updates.tagline;
    }
    
    // Use raw SQL to update the configuration
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== 'string') continue;
      
      // Check if the key exists
      const existing = await prisma.$queryRaw<ConfigEntry[]>`
        SELECT id FROM "SiteConfig" WHERE key = ${key}
      `;
      
      if (existing.length > 0) {
        // Update existing entry
        await prisma.$executeRaw`
          UPDATE "SiteConfig" SET value = ${value}, "updatedAt" = NOW() 
          WHERE key = ${key}
        `;
      } else {
        // Create new entry
        await prisma.$executeRaw`
          INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
          VALUES (gen_random_uuid(), ${key}, ${value}, NOW(), NOW())
        `;
      }
    }
    
    // Explicitly ensure siteTitle and metaDescription are set
    if (updates.siteName) {
      const siteTitle = await prisma.$queryRaw<ConfigEntry[]>`
        SELECT id FROM "SiteConfig" WHERE key = 'siteTitle'
      `;
      
      if (siteTitle.length > 0) {
        await prisma.$executeRaw`
          UPDATE "SiteConfig" SET value = ${updates.siteName}, "updatedAt" = NOW() 
          WHERE key = 'siteTitle'
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
          VALUES (gen_random_uuid(), 'siteTitle', ${updates.siteName}, NOW(), NOW())
        `;
      }
    }
    
    if (updates.tagline) {
      const metaDescription = await prisma.$queryRaw<ConfigEntry[]>`
        SELECT id FROM "SiteConfig" WHERE key = 'metaDescription'
      `;
      
      if (metaDescription.length > 0) {
        await prisma.$executeRaw`
          UPDATE "SiteConfig" SET value = ${updates.tagline}, "updatedAt" = NOW() 
          WHERE key = 'metaDescription'
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
          VALUES (gen_random_uuid(), 'metaDescription', ${updates.tagline}, NOW(), NOW())
        `;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating site configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 