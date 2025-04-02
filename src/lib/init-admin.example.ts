import prisma from './prisma';
import * as bcrypt from 'bcryptjs';

/**
 * Ensures an admin user exists with the email admin@example.com
 * If the user doesn't exist, it will be created with the password from environment variable
 */
export async function ensureAdminExists() {
  try {
    console.log('Checking for admin user...');
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com',
        isAdmin: true
      }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return { success: true, message: 'Admin user already exists' };
    }

    // Create admin user if it doesn't exist
    console.log('Creating admin user...');
    
    // Use environment variable or fallback to 'admin123'
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        isAdmin: true,
      }
    });

    console.log('Admin user created successfully:', newAdmin.id);
    return { success: true, message: 'Admin user created successfully' };
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
    return { success: false, message: 'Failed to create admin user', error };
  }
} 