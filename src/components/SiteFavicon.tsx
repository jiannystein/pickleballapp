'use client';

import { useState, useEffect } from 'react';

export default function SiteFavicon() {
  const [favicon, setFavicon] = useState<string>('/uploads/logo/default-favicon.ico');

  useEffect(() => {
    async function fetchFavicon() {
      try {
        const res = await fetch('/api/site-config');
        if (res.ok) {
          const data = await res.json();
          if (data.favicon) {
            setFavicon(data.favicon);
            
            // Update favicon links
            const links = document.querySelectorAll('link[rel*="icon"]');
            links.forEach(link => link.remove());
            
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = data.favicon;
            document.head.appendChild(newLink);
            
            const shortcutLink = document.createElement('link');
            shortcutLink.rel = 'shortcut icon';
            shortcutLink.href = data.favicon;
            document.head.appendChild(shortcutLink);
          }
        }
      } catch (error) {
        console.error('Error fetching site favicon:', error);
      }
    }

    fetchFavicon();
  }, []);

  // This component doesn't render anything visible
  return null;
} 