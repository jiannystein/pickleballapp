'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState(6); // Number of items to show before "More" dropdown

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (res.ok && data.isAdmin) {
          setIsAdmin(true);
        } else {
          router.push('/sessions');
        }
      } catch (err) {
        console.error('Error checking admin access:', err);
        router.push('/sessions');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  // Update visible items based on screen size
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1400) {
        setVisibleItems(7); // Show all items on large screens
      } else if (window.innerWidth > 1100) {
        setVisibleItems(5); // Show 5 items on medium screens
      } else if (window.innerWidth > 768) {
        setVisibleItems(3); // Show 3 items on smaller screens
      } else {
        setVisibleItems(2); // Only show 2 items on mobile
      }
    }

    handleResize(); // Call once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close more menu when clicking elsewhere
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuOpen && !(event.target as Element).closest('#more-menu-container')) {
        setMoreMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-indigo-400 animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Users', 
      href: '/admin/users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      name: 'Activities', 
      href: '/admin/activities',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    { 
      name: 'Bug Reports', 
      href: '/admin/bug-reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    { 
      name: 'Announcements', 
      href: '/admin/announcements',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    { 
      name: 'Locations', 
      href: '/admin/locations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      name: 'About Page', 
      href: '/admin/about',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: 'Customize', 
      href: '/admin/customize',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  // Separate visible and hidden navigation items
  const visibleNavItems = navItems.slice(0, visibleItems);
  const hiddenNavItems = navItems.slice(visibleItems);

  // Determine the appropriate content padding based on the current path
  const getContentPadding = () => {
    // Dashboard and Locations need standard padding
    if (pathname === '/admin' || pathname?.startsWith('/admin/locations')) {
      return 'pt-6';
    }
    // Users, Activities, Announcements, Bug Reports, About Page, and Customize pages need less padding
    else if (
      pathname?.startsWith('/admin/users') || 
      pathname?.startsWith('/admin/activities') || 
      pathname?.startsWith('/admin/announcements') || 
      pathname?.startsWith('/admin/bug-reports') ||
      pathname?.startsWith('/admin/about') || 
      pathname?.startsWith('/admin/customize')
    ) {
      return 'pt-2';
    }
    // Default padding for any other pages
    return 'pt-4';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-16 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Visible Navigation Items */}
            <div className="flex space-x-2">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname?.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group
                      ${isActive ? 
                        'bg-indigo-900/30 text-indigo-400 border-b-2 border-indigo-500 shadow-sm' : 
                        'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-sm'
                      }
                    `}
                  >
                    <span className={`${isActive ? '' : 'group-hover:text-indigo-400'} transition-colors mr-2`}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* "More" Dropdown */}
              {hiddenNavItems.length > 0 && (
                <div id="more-menu-container" className="relative">
                  <button 
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className={`
                      flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                      ${moreMenuOpen ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                    aria-expanded={moreMenuOpen}
                  >
                    <span className="mr-1">More</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {moreMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 border border-gray-700 z-50">
                      <div className="py-1">
                        {hiddenNavItems.map((item) => {
                          const isActive = pathname === item.href || 
                            (item.href !== '/admin' && pathname?.startsWith(item.href));
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`
                                flex items-center px-4 py-2 text-sm group
                                ${isActive ? 
                                  'bg-indigo-900/30 text-indigo-400' : 
                                  'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }
                              `}
                              onClick={() => setMoreMenuOpen(false)}
                            >
                              <span className={`${isActive ? '' : 'group-hover:text-indigo-400'} transition-colors mr-2`}>
                                {item.icon}
                              </span>
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Exit Admin Button */}
            <Link
              href="/sessions"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-800/20 hover:text-white transition-all duration-200 group hover:shadow-sm"
            >
              <span className="group-hover:text-red-400 transition-colors mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </span>
              <span className="text-red-300 group-hover:text-red-200">Exit Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${getContentPadding()}`}>
        {children}
      </main>
    </div>
  );
} 