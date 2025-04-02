'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { Tab } from '@headlessui/react';
import { UserIcon, KeyIcon, BellIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface User {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  userId?: string;
}

// Define PlayerStats interface similar to the one in PlayerCard
interface PlayerStats {
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  sessions: {
    created: {
      total: number;
      completed: number;
      cancelled: number;
      affectedByCancellation: number;
      active: number;
    };
    joined: {
      total: number;
      completed: number;
      cancelled: number;
      affectedByCancellation: number;
      active: number;
    };
    total: number;
  };
  ratings: {
    overall: number;
    skillLevel: number;
    sportsmanship: number;
    communication: number;
    punctuality: number;
    fairPlay: number;
    totalReviews: number;
  };
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch player stats when user data is loaded
  useEffect(() => {
    if (user?.userId) {
      fetchPlayerStats(user.userId);
    }
  }, [user?.userId]);

  async function fetchPlayerStats(userId: string) {
    try {
      setStatsLoading(true);
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching player stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        router.push('/auth/login');
      }
    } catch (err) {
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(prev => prev ? { ...prev, ...data } : null);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const maxSize = 1024 * 1024; // 1MB

    if (file.size > maxSize) {
      // Compress image if it's too large
      const compressed = await compressImage(file);
      if (compressed.size > maxSize) {
        setError('Image is too large. Please choose a smaller image.');
        return;
      }
      await uploadImage(compressed);
    } else {
      await uploadImage(file);
    }
  }

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 800;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
            },
            'image/jpeg',
            0.7
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage(file: File | Blob) {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      console.log('Uploading avatar...');
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      console.log('Avatar uploaded successfully:', data);
      console.log('New avatar URL:', data.avatarUrl);
      
      // Update local state
      setUser(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
      
      // Dispatch auth-state-changed event to update navigation bar
      window.dispatchEvent(new Event('auth-state-changed'));
      
      // Show success message before reloading
      setError(''); // Clear any previous errors
      alert('Profile picture updated successfully! The page will refresh to apply changes.');
      
      // Force a complete page reload to ensure the JWT token is refreshed
      window.location.href = '/profile';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    }
  }

  // Star display component for ratings
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        <span className="text-lg font-semibold text-yellow-500 mr-1">{rating.toFixed(1)}</span>
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Account Settings</h2>
          <p className="mt-2 text-gray-400">Manage your profile information and security settings</p>
        </div>

        {/* User avatar section - kept separate from tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-2xl p-6 mb-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <UserAvatar
                name={user?.name || ''}
                imageUrl={user?.avatarUrl}
                size={120}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                <label
                  className="cursor-pointer text-white text-xs font-medium p-2"
                >
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-medium text-white">{user?.name}</h3>
              <p className="text-gray-400">{user?.email}</p>
              {user?.phone && <p className="text-gray-400">{user?.phone}</p>}
              
              <div className="mt-4">
                <label
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg cursor-pointer transition-colors text-sm"
                >
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-900/30 border border-green-500/50 text-green-200 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Tabbed interface - moved before player stats */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-800/50 backdrop-blur-sm p-1 mb-6">
            <Tab
              className={({ selected }: { selected: boolean }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                 ${
                   selected
                     ? 'bg-indigo-600 text-white shadow'
                     : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                 }`
              }
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Profile
            </Tab>
            <Tab
              className={({ selected }: { selected: boolean }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                 ${
                   selected
                     ? 'bg-indigo-600 text-white shadow'
                     : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                 }`
              }
            >
              <KeyIcon className="h-5 w-5 mr-2" />
              Security
            </Tab>
            <Tab
              className={({ selected }: { selected: boolean }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
                 ${
                   selected
                     ? 'bg-indigo-600 text-white shadow'
                     : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                 }`
              }
            >
              <BellIcon className="h-5 w-5 mr-2" />
              Notifications
            </Tab>
          </Tab.List>

          <Tab.Panels>
            {/* Profile Tab */}
            <Tab.Panel>
              <div className="bg-gray-800 shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-medium text-white mb-5 flex items-center">
                  <UserIcon className="h-6 w-6 mr-2 text-indigo-400" />
                  Personal Information
                </h3>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-6 mt-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Display Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={user?.name}
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        readOnly
                        defaultValue={user?.email}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 text-gray-400 cursor-not-allowed text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Contact support if you need to change your email address
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Phone (optional)
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={user?.phone || ''}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="e.g., +1 (555) 123-4567"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className={`bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg shadow-md transition-colors
                          ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </Tab.Panel>

            {/* Security Tab */}
            <Tab.Panel>
              <ChangePasswordForm />
            </Tab.Panel>

            {/* Notifications Tab */}
            <Tab.Panel>
              <div className="bg-gray-800 shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-medium text-white mb-5 flex items-center">
                  <BellIcon className="h-6 w-6 mr-2 text-indigo-400" />
                  Notification Settings
                </h3>
                
                <p className="text-gray-400 text-sm mb-4">
                  Choose how you receive notifications and updates. 
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-white">Email Notifications</h4>
                      <p className="text-xs text-gray-400">Receive emails for important updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-white">New Session Alerts</h4>
                      <p className="text-xs text-gray-400">Get notified about new pickleball sessions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <h4 className="text-sm font-medium text-white">Session Reminders</h4>
                      <p className="text-xs text-gray-400">Receive reminders about upcoming sessions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-white">Marketing Communications</h4>
                      <p className="text-xs text-gray-400">Receive news and promotional materials</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled
                    className="bg-gray-600 text-gray-300 py-2 px-6 rounded-lg shadow-md transition-colors cursor-not-allowed opacity-60"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Player Stats Card - moved after tabbed interface */}
        <div className="bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-2xl p-6 mt-6">
          <h3 className="text-xl font-medium text-white mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-indigo-400" />
            Player Statistics
          </h3>

          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : !stats ? (
            <p className="text-gray-400 text-center py-4">No player statistics available yet.</p>
          ) : (
            <div>
              {/* Overall Rating */}
              <div className="flex justify-between items-center mb-6 p-3 rounded-lg bg-gray-700/30 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="mr-3 p-2 bg-indigo-500/20 rounded-full">
                    <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-gray-300 font-medium">Overall Rating</h4>
                    <p className="text-xs text-gray-500">{stats.ratings.totalReviews} review{stats.ratings.totalReviews !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-yellow-500">{stats.ratings.overall.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs ml-1">/5</span>
                </div>
              </div>

              {/* Session Stats */}
              <h4 className="text-gray-300 text-sm font-medium mb-3 px-1 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Session Stats
              </h4>
              
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 mb-6">
                {/* Total Sessions - Main Stat */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700/30">
                  <div className="text-gray-400 text-sm">Total Sessions</div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                      {stats.sessions.total}
                    </span>
                  </div>
                </div>
                
                {/* Session Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Created */}
                  <div className="flex items-center space-x-3 bg-gray-700/20 rounded-lg p-3 hover:bg-gray-700/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-400">{stats.sessions.created.total}</div>
                      <div className="text-xs text-gray-400">Created</div>
                    </div>
                  </div>
                  
                  {/* Joined */}
                  <div className="flex items-center space-x-3 bg-gray-700/20 rounded-lg p-3 hover:bg-gray-700/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-400">{stats.sessions.joined.total}</div>
                      <div className="text-xs text-gray-400">Joined</div>
                    </div>
                  </div>
                  
                  {/* Completed */}
                  <div className="flex items-center space-x-3 bg-gray-700/20 rounded-lg p-3 hover:bg-gray-700/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-900/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-400">
                        {stats.sessions.created.completed + stats.sessions.joined.completed}
                      </div>
                      <div className="text-xs text-gray-400">Completed</div>
                    </div>
                  </div>
                  
                  {/* Cancelled */}
                  <div className="flex items-center space-x-3 bg-gray-700/20 rounded-lg p-3 hover:bg-gray-700/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-400">{stats.sessions.created.cancelled}</div>
                      <div className="text-xs text-gray-400">Cancelled</div>
                    </div>
                  </div>
                  
                  {/* Left */}
                  <div className="flex items-center space-x-3 bg-gray-700/20 rounded-lg p-3 hover:bg-gray-700/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-400">{stats.sessions.joined.cancelled}</div>
                      <div className="text-xs text-gray-400">Left</div>
                    </div>
                  </div>
                  
                  {/* Host Cancelled */}
                  <div className="flex items-center space-x-3 bg-gray-700/20 rounded-lg p-3 hover:bg-gray-700/40 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-900/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-400">{stats.sessions.joined.affectedByCancellation}</div>
                      <div className="text-xs text-gray-400">Host Cancelled</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Breakdown */}
              <h4 className="text-gray-300 text-sm font-medium mb-3 px-1">Rating Breakdown</h4>
              <div className="space-y-2">
                {[
                  { label: 'Skill Level', value: stats.ratings.skillLevel },
                  { label: 'Sportsmanship', value: stats.ratings.sportsmanship },
                  { label: 'Communication', value: stats.ratings.communication },
                  { label: 'Punctuality', value: stats.ratings.punctuality },
                  { label: 'Fair Play', value: stats.ratings.fairPlay }
                ].map((rating) => (
                  <div key={rating.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                    <span className="text-gray-400 text-sm">{rating.label}:</span>
                    <div className="flex items-center">
                      <div className="w-24 h-1.5 bg-gray-700 rounded-full mr-2 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(rating.value / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{rating.value.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 