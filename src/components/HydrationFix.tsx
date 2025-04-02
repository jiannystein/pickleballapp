'use client';

import { useEffect } from 'react';
import { useMessagePortErrorSuppression } from '@/lib/useMessagePortErrorSuppression';

export default function HydrationFix() {
  // Use the custom hook for message port error suppression
  useMessagePortErrorSuppression();
  
  useEffect(() => {
    // Fix hydration issue with HTML element
    const htmlElement = document.documentElement;
    
    // Ensure className is just h-full without hydrated
    if (htmlElement.className.includes('hydrated')) {
      htmlElement.className = 'h-full';
    }
  }, []);

  return null;
} 