import fs from 'fs';
import path from 'path';
import prisma from './prisma';

/**
 * Ensures the uploads directory structure exists and default logo files are present
 */
export async function ensureDefaultAssets() {
  try {
    // Define paths
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const logoDir = path.join(uploadsDir, 'logo');
    const defaultLogoPath = path.join(logoDir, 'default-logo.png');
    const defaultFaviconPath = path.join(logoDir, 'default-favicon.ico');
    
    console.log('Checking for default assets directory structure...');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(logoDir)) {
      console.log('Creating logo directory');
      fs.mkdirSync(logoDir, { recursive: true });
    }
    
    // Check if default logo exists, create simple placeholder if not
    if (!fs.existsSync(defaultLogoPath)) {
      console.log('Creating default logo placeholder');
      
      // Copy from assets folder if it exists, otherwise create a simple file
      const defaultAssetsDir = path.join(process.cwd(), 'src', 'assets');
      const sourceLogoPath = path.join(defaultAssetsDir, 'default-logo.png');
      
      if (fs.existsSync(sourceLogoPath)) {
        fs.copyFileSync(sourceLogoPath, defaultLogoPath);
      } else {
        // Create a very simple placeholder file (1x1 transparent pixel)
        const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
        fs.writeFileSync(defaultLogoPath, minimalPng);
      }
    }
    
    // Check if default favicon exists, create simple placeholder if not
    if (!fs.existsSync(defaultFaviconPath)) {
      console.log('Creating default favicon placeholder');
      
      // Copy from assets folder if it exists, otherwise create a simple file
      const defaultAssetsDir = path.join(process.cwd(), 'src', 'assets');
      const sourceFaviconPath = path.join(defaultAssetsDir, 'default-favicon.ico');
      
      if (fs.existsSync(sourceFaviconPath)) {
        fs.copyFileSync(sourceFaviconPath, defaultFaviconPath);
      } else {
        // Create a very simple placeholder ICO file
        // This is a minimal 16x16 transparent ICO file
        const minimalIco = Buffer.from('AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAA==', 'base64');
        fs.writeFileSync(defaultFaviconPath, minimalIco);
      }
    }
    
    // Update site config to use the default assets if none are set
    await updateSiteConfigWithDefaultAssets();
    
    console.log('Default assets verified successfully');
    return { 
      success: true, 
      message: 'Default assets directory and files ensured',
      paths: {
        logoPath: '/uploads/logo/default-logo.png',
        faviconPath: '/uploads/logo/default-favicon.ico'
      }
    };
  } catch (error) {
    console.error('Error ensuring default assets:', error);
    return { 
      success: false, 
      message: 'Failed to ensure default assets', 
      error 
    };
  }
}

/**
 * Updates the site configuration to use default assets if no custom ones are set
 */
async function updateSiteConfigWithDefaultAssets() {
  try {
    const defaultLogoPath = '/uploads/logo/default-logo.png';
    const defaultFaviconPath = '/uploads/logo/default-favicon.ico';
    
    // Check if logo exists in site config
    const logoConfig = await prisma.$queryRaw<{ id: string, value: string }[]>`
      SELECT id, value FROM "SiteConfig" WHERE key = 'logo'
    `;
    
    if (logoConfig.length === 0) {
      // Logo doesn't exist, create it
      console.log('Adding default logo to site configuration');
      await prisma.$executeRaw`
        INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'logo', ${defaultLogoPath}, NOW(), NOW())
      `;
    }
    
    // Check if favicon exists in site config
    const faviconConfig = await prisma.$queryRaw<{ id: string, value: string }[]>`
      SELECT id, value FROM "SiteConfig" WHERE key = 'favicon'
    `;
    
    if (faviconConfig.length === 0) {
      // Favicon doesn't exist, create it
      console.log('Adding default favicon to site configuration');
      await prisma.$executeRaw`
        INSERT INTO "SiteConfig" (id, key, value, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'favicon', ${defaultFaviconPath}, NOW(), NOW())
      `;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating site config with default assets:', error);
    return false;
  }
}
 