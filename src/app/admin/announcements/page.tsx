'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Announcement } from '@/types';

interface UserData {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export default function AnnouncementsAdmin() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'low',
    expiresAt: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Get current datetime in YYYY-MM-DDThh:mm format for min attribute
  const now = new Date();
  const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      console.log("Current user data:", data);
      setCurrentUser(data);
      
      if (res.ok && data.isAdmin) {
        setIsAdmin(true);
        fetchAnnouncements();
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

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      } else {
        console.error("Failed to fetch announcements:", await res.text());
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      console.log("Submitting announcement with createdById:", currentUser?.userId);
      
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Announcement creation failed:", data);
        throw new Error(data.error || data.details || 'Failed to create announcement');
      }

      // Reset form and refresh announcements
      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'low',
        expiresAt: ''
      });
      fetchAnnouncements();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  }

  async function handleDeactivate(id: string) {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error deactivating announcement:', error);
    }
  }

  // Function to handle clicking the date picker wrapper
  const handleDatePickerClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-white text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Manage Announcements</h1>

        {/* Create new announcement form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-white mb-6">Create New Announcement</h2>
          {error && (
            <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-300 mb-2">
                  Expires At (Optional)
                </label>
                <div 
                  className="relative cursor-pointer"
                  onClick={handleDatePickerClick}
                >
                  <input
                    ref={dateInputRef}
                    type="datetime-local"
                    id="expiresAt"
                    value={newAnnouncement.expiresAt}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expiresAt: e.target.value }))}
                    min={localDatetime}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="absolute inset-0" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Announcement
              </button>
            </div>
          </form>
        </div>

        {/* Active announcements list */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Active Announcements</h2>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No active announcements</p>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg bg-gray-700/50 border-l-4 ${
                    announcement.priority === 'high'
                      ? 'border-red-500'
                      : announcement.priority === 'medium'
                      ? 'border-yellow-500'
                      : 'border-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-medium">{announcement.title}</h3>
                      <p className="text-gray-300 text-sm mt-1">{announcement.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <span>Priority: {announcement.priority}</span>
                        {announcement.expiresAt && (
                          <span>Expires: {new Date(announcement.expiresAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeactivate(announcement.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 