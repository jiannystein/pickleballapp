import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserAvatar from './UserAvatar';

// Debug flag to control logging
const DEBUG = process.env.NODE_ENV === 'development' && false; // Set to true only when debugging

interface User {
  id?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

interface ProfileDropdownProps {
  user: User;
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(() => Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Memoize these values to avoid recreating them on every render
  const memoizedUserProps = useMemo(() => ({
    name: user.name,
    imageUrl: user.avatarUrl,
    userId: user.id
  }), [user.name, user.avatarUrl, user.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Update timestamp only when avatar URL changes
  useEffect(() => {
    if (DEBUG) console.log('ProfileDropdown: Avatar URL changed to:', user.avatarUrl);
    setAvatarTimestamp(Date.now());
  }, [user.avatarUrl]);

  async function handleSignOut() {
    try {
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        // Dispatch custom event for auth state change
        window.dispatchEvent(new Event('auth-state-changed'));
        
        // Redirect to home page
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 focus:outline-none group p-2 rounded-lg hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative flex items-center">
          <UserAvatar 
            name={memoizedUserProps.name}
            imageUrl={memoizedUserProps.imageUrl} 
            size={36}
            userId={memoizedUserProps.userId}
            showPlayerCard={!!memoizedUserProps.userId}
            playerCardPosition="bottom"
            playerCardTrigger="hover"
            key={`avatar-${avatarTimestamp}`} 
          />
          <span className="text-gray-300 group-hover:text-indigo-400 font-light tracking-wide transition-colors ml-2 hidden md:inline-block">
            {user.name}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            Your Profile
          </Link>
          {user.isAdmin && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 