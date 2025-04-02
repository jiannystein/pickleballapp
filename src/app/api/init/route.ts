import { NextResponse } from 'next/server';
import { ensureAdminExists } from '@/lib/init-admin';
import { ensureDefaultAssets } from '@/lib/init-assets';
import { startScheduledTasks } from '@/lib/tasks';
import '@/lib/env'; // Import environment loader

// Use module-level flags to ensure initialization only happens once per server instance
let initialized = false;
let tasksStarted = false;

export async function GET() {
  try {
    if (!initialized) {
      console.log('Starting server initialization...');
      console.log('Environment check - DATABASE_URL available:', !!process.env.DATABASE_URL);
      
      // Check for admin user and create if it doesn't exist
      const adminResult = await ensureAdminExists();
      
      // Ensure default assets exist (logo, favicon)
      const assetsResult = await ensureDefaultAssets();
      
      // Start scheduled tasks if not already running
      if (!tasksStarted) {
        console.log('Starting scheduled tasks...');
        startScheduledTasks();
        tasksStarted = true;
      }
      
      initialized = true;
      
      console.log('Server initialization complete');
      return NextResponse.json({ 
        message: 'Server initialized successfully', 
        results: {
          admin: adminResult,
          assets: assetsResult,
          tasks: { started: tasksStarted }
        }
      });
    } else {
      // Even if the server is initialized, make sure tasks are running
      if (!tasksStarted) {
        console.log('Starting scheduled tasks on initialized server...');
        startScheduledTasks();
        tasksStarted = true;
      }
      
      console.log('Server already initialized in this instance');
      return NextResponse.json({ 
        message: 'Server was already initialized',
        tasks: { started: tasksStarted }
      });
    }
  } catch (error) {
    console.error('Error during server initialization:', error);
    return NextResponse.json(
      { error: 'Initialization failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 