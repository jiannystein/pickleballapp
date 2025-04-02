import { useState, useEffect, useRef } from 'react';
import { Announcement } from '@/types';

interface ExtendedAnnouncement extends Announcement {
  dismissed: boolean;
}

interface NotificationIconProps {
  className?: string;
}

export default function NotificationIcon({ className = '' }: NotificationIconProps) {
  const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnnouncements();
    
    // Set up an interval to check for new announcements every minute
    const intervalId = setInterval(fetchAnnouncements, 60000);
    
    // Add event listener to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function fetchAnnouncements() {
    try {
      console.log('NotificationIcon: Fetching announcements...');
      const res = await fetch('/api/announcements', {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('NotificationIcon: Announcements fetched:', data);
        // Only display non-dismissed announcements
        setAnnouncements(data.filter((a: ExtendedAnnouncement) => !a.dismissed));
      } else {
        console.error('NotificationIcon: Failed to fetch announcements', await res.text());
      }
    } catch (error) {
      console.error('NotificationIcon: Error fetching announcements:', error);
    }
  }

  async function dismissAnnouncement(id: string) {
    try {
      console.log('NotificationIcon: Dismissing announcement', id);
      const res = await fetch(`/api/announcements/${id}/dismiss`, {
        method: 'POST'
      });
      if (res.ok) {
        console.log('NotificationIcon: Announcement dismissed successfully');
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } else {
        console.error('NotificationIcon: Failed to dismiss announcement', await res.text());
      }
    } catch (error) {
      console.error('NotificationIcon: Error dismissing announcement:', error);
    }
  }

  const hasUnread = announcements.length > 0;

  if (!hasUnread && !showDropdown) {
    return null; // Don't render anything if there are no announcements and dropdown is closed
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-full hover:bg-gray-800 transition-colors ${className}`}
      >
        <svg
          className="w-6 h-6 text-gray-400 hover:text-indigo-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {hasUnread && (
          <span className="absolute top-1 right-1 block h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No new announcements</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-3 rounded-lg bg-gray-700/50 border-l-4 ${
                      announcement.priority === 'high'
                        ? 'border-red-500'
                        : announcement.priority === 'medium'
                        ? 'border-yellow-500'
                        : 'border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-white font-medium">{announcement.title}</h4>
                      <button
                        onClick={() => dismissAnnouncement(announcement.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 