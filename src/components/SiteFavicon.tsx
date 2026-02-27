'use client';

import { useEffect, useRef } from 'react';

export default function SiteFavicon() {
  const addedLinksRef = useRef<HTMLLinkElement[]>([]);

  useEffect(() => {
    async function fetchFavicon() {
      try {
        const res = await fetch('/api/site-config');
        if (res.ok) {
          const data = await res.json();
          if (data.favicon) {
            // Update existing React-managed favicon links in place (don't remove them)
            const existingLinks = document.querySelectorAll('link[rel*="icon"]');
            existingLinks.forEach(link => {
              (link as HTMLLinkElement).href = data.favicon;
            });

            // If no existing links were found, create new ones
            if (existingLinks.length === 0) {
              const newLink = document.createElement('link');
              newLink.rel = 'icon';
              newLink.href = data.favicon;
              document.head.appendChild(newLink);
              addedLinksRef.current.push(newLink);

              const shortcutLink = document.createElement('link');
              shortcutLink.rel = 'shortcut icon';
              shortcutLink.href = data.favicon;
              document.head.appendChild(shortcutLink);
              addedLinksRef.current.push(shortcutLink);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching site favicon:', error);
      }
    }

    fetchFavicon();

    // Cleanup only the links we created
    return () => {
      addedLinksRef.current.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      addedLinksRef.current = [];
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
