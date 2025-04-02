'use client';

import { useEffect, useState } from 'react';

export default function InitializeServer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Check if server was already initialized in this session
    const wasInitialized = localStorage.getItem('server_initialized');
    const lastInitTime = localStorage.getItem('server_init_time');
    const currentTime = Date.now();
    
    // Only initialize if:
    // 1. It hasn't been initialized before, or
    // 2. It was initialized more than 30 minutes ago (handles page refreshes)
    const shouldInitialize = !wasInitialized || 
      (lastInitTime && (currentTime - parseInt(lastInitTime, 10)) > 30 * 60 * 1000);
    
    const initServer = async () => {
      try {
        console.log('Initializing server on client mount...');
        const response = await fetch('/api/init', {
          // Add cache control for more reliable initialization
          cache: 'no-store',
          headers: {
            'pragma': 'no-cache',
            'cache-control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Initialization failed');
        }
        
        const data = await response.json();
        
        // Only update state if the component is still mounted
        if (mounted) {
          console.log('Server initialization response:', data);
          // Set localStorage to avoid duplicate initializations
          localStorage.setItem('server_initialized', 'true');
          localStorage.setItem('server_init_time', currentTime.toString());
          setInitialized(true);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing server:', error);
          setError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    if (shouldInitialize) {
      initServer();
    } else {
      console.log('Server already initialized recently, skipping initialization');
      setInitialized(true);
    }
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 