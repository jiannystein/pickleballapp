import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserAvatar from './UserAvatar';

interface User {
  id?: string;  // Add id field to User interface
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
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(user.avatarUrl);
  const [userId, setUserId] = useState<string | undefined>(user.id);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Update when user prop changes
  useEffect(() => {
    console.log('ProfileDropdown: User prop changed, updating avatar');
    console.log('ProfileDropdown: New avatar URL:', user.avatarUrl);
    setCurrentAvatar(user.avatarUrl);
    setUserId(user.id);
    setAvatarKey(Date.now());
  }, [user.avatarUrl, user.id]);
  
  useEffect(() => {
    // Listen for avatar changes
    const handleAuthChanged = async () => {
      console.log('ProfileDropdown: auth-state-changed event detected');
      // Force avatar component to remount
      setAvatarKey(Date.now());
      
      // Fetch the latest user data to ensure we have the current avatar URL
      try {
        const cacheBuster = Date.now();
        const res = await fetch(`/api/auth/me?_=${cacheBuster}`, {
          cache: 'no-store',
          headers: {
            'pragma': 'no-cache',
            'cache-control': 'no-cache'
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          console.log('ProfileDropdown: Fetched updated user data', userData);
          console.log('ProfileDropdown: New avatar URL from API:', userData.avatarUrl);
          setCurrentAvatar(userData.avatarUrl);
          setUserId(userData.userId);
        }
      } catch (err) {
        console.error('ProfileDropdown: Failed to fetch updated user data', err);
      }
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Dispatch custom event to notify other components about logout
      window.dispatchEvent(new Event('auth-state-changed'));
      
      if (res.redirected) {
        // If the response is a redirect, follow it
        window.location.href = res.url;
      } else {
        // For backward compatibility, redirect to home manually
        router.push('/');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, dispatch event and redirect to home
      window.dispatchEvent(new Event('auth-state-changed'));
      router.push('/');
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
            name={user.name} 
            imageUrl={currentAvatar} 
            size={36}
            userId={userId}
            showPlayerCard={!!userId}
            playerCardPosition="bottom"
            playerCardTrigger="hover"
            key={`avatar-${avatarKey}`} 
          />
          <span className="text-gray-300 group-hover:text-indigo-400 font-light tracking-wide transition-colors ml-2 hidden md:inline-block">
            {user.name}
          </span>
        </div>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-1 z-10 border border-gray-700 sm:origin-top-right"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <Link
            href="/profile"
            className="block px-4 py-3 text-sm text-gray-300 hover:text-indigo-400 hover:bg-gray-700 font-light tracking-wide transition-colors"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            Edit Profile
          </Link>
          {user.isAdmin && (
            <Link
              href="/admin"
              className="block px-4 py-3 text-sm text-gray-300 hover:text-indigo-400 hover:bg-gray-700 font-light tracking-wide transition-colors"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-indigo-400 hover:bg-gray-700 font-light tracking-wide transition-colors"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
} 