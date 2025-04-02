'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import ProfileDropdown from './ProfileDropdown';
import NotificationBadge from './NotificationBadge';
import CombinedNotifications from './CombinedNotifications';
import Image from 'next/image';
import usePendingReviews from '@/lib/usePendingReviews';

interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

interface SiteConfig {
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
}

// Create a debug flag to control logging
const DEBUG = process.env.NODE_ENV === 'development' && false; // Set to true only when debugging

export default function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    siteName: 'PickleBall',
    tagline: 'Connect with fellow pickleball players and join sessions',
    primaryColor: '#4f46e5',
    secondaryColor: '#3b82f6'
  });
  
  // Use our custom hook for pending reviews
  const { pendingReviewsCount } = usePendingReviews();
  
  // Use refs for stable event handlers
  const authStateHandler = useRef<() => void>();
  const isInitialMount = useRef(true);
  
  const fetchUser = useCallback(async () => {
    try {
      if (DEBUG) console.log('Navigation: Fetching user data...');
      const cacheBuster = Date.now();
      const res = await fetch(`/api/auth/me?_=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        },
        next: { revalidate: 0 }
      });
      const data = await res.json();
      
      if (res.ok) {
        if (DEBUG) console.log('Navigation: Setting user with avatarUrl:', data.avatarUrl);
        setUser(data);
      } else {
        setUser(null);
        if (DEBUG) console.log('Navigation: Clearing user due to error response');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSiteConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config');
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error fetching site configuration:', error);
    }
  }, []);

  // Initialize event handlers only once
  useEffect(() => {
    // Create stable references to event handlers
    authStateHandler.current = () => {
      if (DEBUG) console.log('Auth state changed, fetching user');
      fetchUser();
    };
  }, [fetchUser]);

  // Setup once on initial mount
  useEffect(() => {
    fetchUser();
    fetchSiteConfig();
    
    // Add event listeners (only on initial mount)
    if (authStateHandler.current) {
      window.addEventListener('auth-state-changed', authStateHandler.current);
    }
    
    // Cleanup on unmount
    return () => {
      if (authStateHandler.current) {
        window.removeEventListener('auth-state-changed', authStateHandler.current);
      }
    };
  }, []); // Empty dependency array = run once on mount
  
  const brandColor = { color: siteConfig.primaryColor };
  const buttonStyle = { 
    backgroundColor: siteConfig.primaryColor 
  };
  const buttonHoverStyle = { 
    backgroundColor: siteConfig.secondaryColor 
  };
  
  return (
    <nav className="bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center font-bold text-xl"
              style={brandColor}
            >
              {siteConfig.logo ? (
                <div className="flex items-center">
                  <div className="relative h-8 w-8 mr-2">
                    <Image 
                      src={siteConfig.logo} 
                      alt={siteConfig.siteName} 
                      fill 
                      sizes="32px"
                      style={{objectFit: 'contain'}}
                      priority
                      unoptimized={siteConfig.logo.startsWith('http')}
                    />
                  </div>
                  <span>{siteConfig.siteName}</span>
                </div>
              ) : (
                siteConfig.siteName
              )}
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {user ? (
                <Link
                  href="/sessions"
                  className={`${
                    pathname === '/sessions'
                      ? `border-current text-current`
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  style={pathname === '/sessions' ? brandColor : {}}
                >
                  Sessions
                </Link>
              ) : null}
              {user ? (
                <div className="relative">
                  <Link
                    href="/my-sessions"
                    className={`${
                      pathname === '/my-sessions'
                        ? `border-current text-current`
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    style={pathname === '/my-sessions' ? brandColor : {}}
                  >
                    My Sessions
                  </Link>
                  {pendingReviewsCount > 0 && <NotificationBadge count={pendingReviewsCount} className="-top-2 right-0" />}
                </div>
              ) : null}
              {user ? (
                <Link
                  href="/locations"
                  className={`${
                    pathname.startsWith('/locations')
                      ? `border-current text-current`
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  style={pathname.startsWith('/locations') ? brandColor : {}}
                >
                  Locations
                </Link>
              ) : null}
              <Link
                href="/about"
                className={`${
                  pathname === '/about'
                    ? `border-current text-current`
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                style={pathname === '/about' ? brandColor : {}}
              >
                About
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="hidden md:flex md:items-center">
                <CombinedNotifications />
                <div className="ml-3">
                  <ProfileDropdown user={user} />
                </div>
              </div>
            ) : (
              <div className="hidden md:flex md:space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-400 hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-white hover:opacity-90 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out shadow-sm"
                  style={buttonStyle}
                >
                  Register
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              {user && (
                <div className="flex items-center">
                  <CombinedNotifications />
                  <div className="ml-2">
                    <ProfileDropdown user={user} />
                  </div>
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-700">
          {user ? (
            <>
              <Link
                href="/sessions"
                className={`${
                  pathname === '/sessions'
                    ? 'bg-gray-800 text-current'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
                style={pathname === '/sessions' ? brandColor : {}}
              >
                Sessions
              </Link>
              <div className="relative">
                <Link
                  href="/my-sessions"
                  className={`${
                    pathname === '/my-sessions'
                      ? 'bg-gray-800 text-current'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={pathname === '/my-sessions' ? brandColor : {}}
                >
                  My Sessions
                </Link>
                {pendingReviewsCount > 0 && <NotificationBadge count={pendingReviewsCount} className="top-1 right-3" />}
              </div>
              <Link
                href="/locations"
                className={`${
                  pathname.startsWith('/locations')
                    ? 'bg-gray-800 text-current'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
                style={pathname.startsWith('/locations') ? brandColor : {}}
              >
                Locations
              </Link>
            </>
          ) : (
            <div className="py-4 flex flex-col space-y-3">
              <Link
                href="/auth/login"
                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium border border-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="text-white hover:bg-opacity-90 block px-4 py-3 rounded-md text-center text-base font-medium shadow-md transition-colors duration-150 ease-in-out"
                onClick={() => setMobileMenuOpen(false)}
                style={buttonStyle}
              >
                Create an Account
              </Link>
            </div>
          )}
          <Link
            href="/about"
            className={`${
              pathname === '/about'
                ? 'bg-gray-800 text-current'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            } block px-3 py-2 rounded-md text-base font-medium`}
            onClick={() => setMobileMenuOpen(false)}
            style={pathname === '/about' ? brandColor : {}}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
} 