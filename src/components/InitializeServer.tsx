'use client';

import { useEffect, useState } from 'react';

export default function InitializeServer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
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
          setInitialized(true);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing server:', error);
          setError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    initServer();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
} 