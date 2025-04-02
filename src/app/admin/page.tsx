'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  isApproved: boolean;
  photoUrl?: string;
}

interface LocationRequest {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  status: string;
  requestedBy: {
    name: string;
    email: string;
  };
}

interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  expiresAt: string | null;
  priority: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationRequests, setLocationRequests] = useState<LocationRequest[]>([]);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [initializingReviews, setInitializingReviews] = useState(false);
  const [initializeResult, setInitializeResult] = useState<any>(null);
  const router = useRouter();

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 600); // Show refresh animation for at least 600ms
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      // Fetch summary data for dashboard
      const [usersRes, locationsRes, requestsRes, activitiesRes, announcementsRes] = await Promise.all([
        fetch('/api/admin/users'),
          fetch('/api/admin/locations'),
        fetch('/api/admin/location-requests'),
        fetch('/api/admin/user-activities?limit=5'), // Just get 5 most recent activities
        fetch('/api/announcements')
      ]);
      
      const [usersData, locationsData, requestsData, activitiesData, announcementsData] = await Promise.all([
        usersRes.json(),
        locationsRes.json(),
        requestsRes.json(),
        activitiesRes.json(),
        announcementsRes.json()
      ]);
      
      if (usersRes.ok) setUsers(usersData);
      if (locationsRes.ok) setLocations(locationsData);
      if (requestsRes.ok) setLocationRequests(requestsData);
      if (activitiesRes.ok) setRecentActivities(activitiesData.activities || []);
      if (announcementsRes.ok) setAnnouncements(announcementsData || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(dateString: string) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatActivityType(type: string) {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  // Add function to initialize reviews
  const initializeReviews = async () => {
    try {
      setInitializingReviews(true);
      setInitializeResult(null);
      
      const response = await fetch('/api/tasks/initialize-reviews', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to initialize reviews');
      }
      
      console.log('Reviews initialization result:', result);
      setInitializeResult(result);
    } catch (error) {
      console.error('Error initializing reviews:', error);
      setInitializeResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setInitializingReviews(false);
    }
  };

  if (loading) {
  return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-10 w-10 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full"></div>
          <div className="text-indigo-400">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  const adminCount = users.filter(user => user.isAdmin).length;
  const pendingRequests = locationRequests.filter(req => req.status === 'pending').length;
  const activeAnnouncements = announcements.filter(a => a.isActive).length;
  const lastActivityTime = recentActivities.length > 0 
    ? new Date(recentActivities[0].createdAt).getTime() 
    : null;
  const timeAgo = lastActivityTime 
    ? Math.floor((Date.now() - lastActivityTime) / (1000 * 60)) 
    : null;

  return (
    <div>
      {error && (
        <div className="bg-red-800 text-white p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 shadow-lg">
        <div className="absolute right-0 top-0 opacity-20">
          <svg width="210" height="210" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2"/>
            <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="2"/>
            <circle cx="100" cy="100" r="20" stroke="white" strokeWidth="2"/>
          </svg>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{getGreeting()}</h1>
            <p className="text-indigo-200 mt-2">Welcome to the PickleBall admin dashboard</p>
            
            <div className="mt-4 text-indigo-200 text-sm flex space-x-4">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                <span>System status: Operational</span>
              </div>
              
              {timeAgo !== null && (
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-400 mr-2"></div>
                  <span>Last activity: {timeAgo < 60 ? `${timeAgo} mins ago` : 'Over an hour ago'}</span>
                </div>
              )}
              
              {pendingRequests > 0 && (
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2"></div>
                  <span>{pendingRequests} pending {pendingRequests === 1 ? 'request' : 'requests'}</span>
                </div>
              )}
            </div>
                        </div>
          
                            <button
            onClick={refreshData} 
            className={`p-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all
              ${refreshing ? 'animate-spin' : ''}`}
            disabled={refreshing}
            aria-label="Refresh dashboard data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
                            </button>
                          </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="group relative overflow-hidden bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-indigo-900/20 hover:-translate-y-1 hover:border-indigo-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="flex items-center justify-between">
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-indigo-900/30 rounded-full transform transition duration-300 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center mt-4 relative z-10">
            <span className="text-gray-400 text-sm">{adminCount} admins</span>
            <span className="mx-2 text-gray-600">•</span>
            <span className="text-gray-400 text-sm">{users.length - adminCount} regular users</span>
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-indigo-900/20 hover:-translate-y-1 hover:border-indigo-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="flex items-center justify-between">
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium">Locations</p>
              <p className="text-3xl font-bold text-white mt-1">{locations.length}</p>
            </div>
            <div className="p-3 bg-indigo-900/30 rounded-full transform transition duration-300 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center mt-4 relative z-10">
            {pendingRequests > 0 ? (
              <span className="text-yellow-400 text-sm flex items-center">
                <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-2 animate-pulse"></span>
                {pendingRequests} pending {pendingRequests === 1 ? 'request' : 'requests'}
              </span>
            ) : (
              <span className="text-green-400 text-sm flex items-center">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                All locations approved
              </span>
            )}
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-indigo-900/20 hover:-translate-y-1 hover:border-indigo-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="flex items-center justify-between">
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium">Announcements</p>
              <p className="text-3xl font-bold text-white mt-1">{announcements.length}</p>
            </div>
            <div className="p-3 bg-indigo-900/30 rounded-full transform transition duration-300 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
                        </div>
                          </div>
          
          <div className="flex items-center mt-4 relative z-10">
            {activeAnnouncements > 0 ? (
              <span className="text-green-400 text-sm">{activeAnnouncements} active</span>
            ) : (
              <span className="text-gray-400 text-sm">No active announcements</span>
            )}
          </div>
        </div>
        
        <div className="group relative overflow-hidden bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-indigo-900/20 hover:-translate-y-1 hover:border-indigo-700/50">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="flex items-center justify-between">
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium">Site Configuration</p>
              <p className="text-xl font-bold text-white mt-1">Customize</p>
            </div>
            <div className="p-3 bg-indigo-900/30 rounded-full transform transition duration-300 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center mt-4 relative z-10">
            <Link href="/admin/customize" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center">
              Edit settings
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
                        </Link>
          </div>
        </div>
      </div>
      
      {/* Admin Tools Section */}
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          Admin Tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-750 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Initialize Pending Reviews</h3>
            <p className="text-gray-300 text-sm mb-4">
              Recalculate and initialize pending review states for all completed sessions. 
              This ensures users see the correct "Rate Players" buttons for sessions that need ratings.
            </p>
            
            <button
              onClick={initializeReviews}
              disabled={initializingReviews}
              className={`px-4 py-2 rounded-md text-white ${
                initializingReviews 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {initializingReviews ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Initialize Reviews'
              )}
            </button>
            
            {initializeResult && (
              <div className={`mt-4 p-3 rounded-md ${
                initializeResult.error 
                  ? 'bg-red-900/50 border border-red-700 text-red-200' 
                  : 'bg-green-900/50 border border-green-700 text-green-200'
              }`}>
                {initializeResult.error ? (
                  <p>Error: {initializeResult.error}</p>
                ) : (
                  <div>
                    <p className="font-medium">{initializeResult.message}</p>
                    <p className="text-sm mt-1">
                      Sessions processed: {initializeResult.sessionsProcessed}, 
                      Success: {initializeResult.successCount}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Add more admin tools here in the future */}
        </div>
      </div>
      
      {/* Activity Graph Visualization (Simplified) */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Activity Trends</h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="flex items-center">
              <span className="inline-block h-3 w-3 rounded-full bg-indigo-500 mr-2"></span>
              Users
            </span>
            <span className="flex items-center">
              <span className="inline-block h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
              Sessions
            </span>
          </div>
        </div>
        
        {/* Simplified Activity Graph */}
        <div className="h-28 flex items-end space-x-2 mb-2">
          {[30, 40, 25, 50, 65, 45, 70].map((height, index) => (
            <div key={index} className="flex flex-col items-center space-y-1 flex-1">
              <div className="w-full flex space-x-1 h-full items-end">
                <div 
                  className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                  style={{height: `${height}%`}}
                ></div>
                <div 
                  className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                  style={{height: `${Math.max(15, height - 15)}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mt-10">
        <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Link href="/admin/announcements" className="group flex flex-col items-center p-6 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all duration-300 border border-gray-600 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/10">
            <div className="p-4 mb-4 bg-indigo-900/50 rounded-full group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <span className="font-medium mb-1">New Announcement</span>
            <span className="text-xs text-gray-400">Create and publish</span>
          </Link>
          
          <Link href="/admin/locations" className="group flex flex-col items-center p-6 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all duration-300 border border-gray-600 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/10">
            <div className="p-4 mb-4 bg-indigo-900/50 rounded-full group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-medium mb-1">Manage Locations</span>
            <span className="text-xs text-gray-400">{pendingRequests > 0 ? `${pendingRequests} pending requests` : 'All approved'}</span>
          </Link>
          
          <Link href="/admin/customize" className="group flex flex-col items-center p-6 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all duration-300 border border-gray-600 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/10">
            <div className="p-4 mb-4 bg-indigo-900/50 rounded-full group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-medium mb-1">Site Settings</span>
            <span className="text-xs text-gray-400">Customize appearance</span>
          </Link>
          
          <Link href="/api/seed" target="_blank" className="group flex flex-col items-center p-6 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all duration-300 border border-gray-600 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/10">
            <div className="p-4 mb-4 bg-indigo-900/50 rounded-full group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="font-medium mb-1">Run Seed Script</span>
            <span className="text-xs text-gray-400">Initialize data</span>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        {/* Users */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Users</h2>
            <Link href="/admin/users" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center group">
              View all
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {users.length > 0 ? users.slice(0, 5).map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <div>
                  {user.isAdmin ? 
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-900/30 text-indigo-400 border border-indigo-800/50">Admin</span> : 
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-400 border border-gray-600">User</span>
                  }
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Activities</h2>
            <Link href="/admin/activities" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center group">
              View all
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {recentActivities.length > 0 ? recentActivities.slice(0, 5).map(activity => (
              <div key={activity.id} className="p-4 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-inner">
                    {activity.user?.name.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{activity.user?.name || 'Unknown User'}</p>
                    <p className="text-indigo-400 text-sm">{formatActivityType(activity.activityType)}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-gray-400 text-xs">{formatDate(activity.createdAt)}</p>
                    <p className="text-gray-500 text-xs">{formatTime(activity.createdAt)}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-gray-500">
                No recent activities
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
} 