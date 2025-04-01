/**
 * Helper functions for site configuration
 */

// Default fallback configuration
const DEFAULT_CONFIG = {
  siteName: 'PickleBall App',
  tagline: 'Connect with fellow pickleball players and join sessions',
  primaryColor: '#6366f1',
  logo: '/logo.png',
  favicon: '/favicon.ico',
};

/**
 * Fetches the site configuration from the API
 * Uses server-side fetching when possible
 */
export async function getSiteConfig() {
  try {
    // Use fetch to get site configuration
    // We need to use absolute URL in server components
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'localhost';
    const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? '' : '3000');
    
    // Construct the base URL, only adding port in development
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `${protocol}://${host}`
      : `${protocol}://${host}${port ? `:${port}` : ''}`;
    
    console.log('Fetching site config from:', `${baseUrl}/api/site-config`);
    
    const response = await fetch(`${baseUrl}/api/site-config`, {
      // Don't use revalidate with no-store
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch site config: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received site config:', data);
    
    const config = { ...DEFAULT_CONFIG, ...data };
    console.log('Final config with defaults:', config);
    
    return config;
  } catch (error) {
    console.error('Error fetching site configuration:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Gets site metadata from site configuration
 */
export async function getSiteMetadata() {
  const config = await getSiteConfig();
  
  // Ensure we use the correct fields in the right order
  const title = config.siteTitle || config.siteName || DEFAULT_CONFIG.siteName;
  const description = config.metaDescription || config.tagline || DEFAULT_CONFIG.tagline;
  
  // Force revalidation of metadata by adding a timestamp
  const timestamp = new Date().getTime();
  
  // Construct the base URL for metadata
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'localhost';
  const port = process.env.PORT || (process.env.NODE_ENV === 'production' ? '' : '3000');
  const baseUrl = process.env.NODE_ENV === 'production'
    ? `${protocol}://${host}`
    : `${protocol}://${host}${port ? `:${port}` : ''}`;
  
  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: config.siteName,
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
    // Add cache control headers
    other: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Last-Modified': new Date().toUTCString(),
      'X-Metadata-Update': timestamp.toString(),
    },
  };
} 