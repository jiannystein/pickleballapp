'use client';

import { useEffect } from 'react';

/**
 * Custom hook to suppress "message port closed" errors
 * This helps clean up the console by hiding these Chrome-specific errors
 * that aren't actual issues with your application
 */
export function useMessagePortErrorSuppression() {
  useEffect(() => {
    // Store original handlers
    const originalConsoleError = console.error;
    const originalWindowOnError = window.onerror;
    
    // Custom console.error handler
    console.error = function(...args) {
      if (args.length > 0) {
        // Check for string error
        if (typeof args[0] === 'string' && args[0].includes('message port closed')) {
          return;
        }
        
        // Check for Error object
        if (args[0] && args[0].message && 
            typeof args[0].message === 'string' && 
            args[0].message.includes('message port closed')) {
          return;
        }
      }
      
      return originalConsoleError.apply(console, args);
    };
    
    // Custom window.onerror handler
    window.onerror = function(message, source, lineno, colno, error) {
      if (message && typeof message === 'string' && message.includes('message port closed')) {
        return true; // Suppress the error
      }
      
      // Call the original handler for other errors
      if (originalWindowOnError) {
        return originalWindowOnError.call(window, message, source, lineno, colno, error);
      }
      
      return false;
    };
    
    // Handler for unhandled promise rejections
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      if (event && event.reason && 
          typeof event.reason.message === 'string' && 
          event.reason.message.includes('message port closed')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    // Add event listener for unhandled rejections
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    
    // Clean up on unmount
    return () => {
      console.error = originalConsoleError;
      window.onerror = originalWindowOnError;
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);
} 