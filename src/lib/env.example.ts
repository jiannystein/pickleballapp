// Ensure environment variables are available
// This is a workaround for the issue where Next.js doesn't consistently load .env files

// Database connection
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const DIRECT_URL = process.env.DIRECT_URL || '';

// Auth secrets
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';
export const JWT_SECRET = process.env.JWT_SECRET || '';

// Make sure all environment variables are available if not set
if (!process.env.DATABASE_URL && DATABASE_URL) {
  process.env.DATABASE_URL = DATABASE_URL;
}

if (!process.env.DIRECT_URL && DIRECT_URL) {
  process.env.DIRECT_URL = DIRECT_URL;
}

if (!process.env.NEXTAUTH_SECRET && NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = NEXTAUTH_SECRET;
}

if (!process.env.JWT_SECRET && JWT_SECRET) {
  process.env.JWT_SECRET = JWT_SECRET;
}

// Export a function to load environment variables
export function loadEnv() {
  return {
    DATABASE_URL,
    DIRECT_URL,
    NEXTAUTH_SECRET,
    JWT_SECRET
  };
}

// Auto-load environment variables
loadEnv(); 