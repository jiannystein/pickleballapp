'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateTime, isSessionEnded } from '@/lib/dateUtils';
import NotificationBadge from '@/components/NotificationBadge';
import { FaRegStar } from 'react-icons/fa6';
import { PiConfettiFill } from 'react-icons/pi';
import usePendingReviews from '@/lib/usePendingReviews';
import { useMessagePortErrorSuppression } from '@/lib/useMessagePortErrorSuppression';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  photoUrl?: string;
}

interface Session {
  id: string;
  title: string;
  description?: string;
  location: Location;
  date: string;
  duration: number;
  maxPlayers: number;
  creator: User;
  players: User[];
  lookingForPlayers?: boolean;
  lookingForTeams?: boolean;
  price?: string;
  paymentMethod?: string;
  contactInfo?: string;
  status: string;
  isPrivate?: boolean;
  pendingReviews?: boolean;
}

export default function MySessionsPage() {
  // Use the custom hook to suppress message port closed errors
  useMessagePortErrorSuppression();
  
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  // Use our custom hook for pending reviews
  const { pendingReviewsCount, pendingSessions } = usePendingReviews();

  // Simple function to determine if a date is in the past
  const isPast = useCallback((dateString: string) => {
    return new Date(dateString) < new Date();
  }, []);

  // Simple function to determine if a date is in the future
  const isFuture = useCallback((dateString: string) => {
    return new Date(dateString) > new Date();
  }, []);

  // Fetch sessions function - clean implementation
  const fetchSessions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const res = await fetch('/api/sessions/user', {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await res.json();
      
      // Get the current user ID if not already set
      if (!currentUserId) {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserId(userData.userId);
        }
  }
  
      // Process sessions to mark completed ones
      const now = new Date();
      const processedSessions = data.map((session: Session) => {
        // If the session has ended and not cancelled/completed, mark as completed
        if (session.status !== 'cancelled' && session.status !== 'completed') {
          if (isSessionEnded(session)) {
          return { ...session, status: 'completed' };
          }
        }
        return session;
      });
      
      // Update sessions with pending reviews information
      if (pendingSessions.length > 0) {
        const pendingSessionIds = new Set(pendingSessions.map(session => session.id));
        
        const finalSessions = processedSessions.map((session: Session) => {
        if (pendingSessionIds.has(session.id)) {
          return { ...session, pendingReviews: true };
        }
        if (session.status === 'completed' || new Date(session.date) < now) {
          return { ...session, pendingReviews: false };
        }
        return session;
      });
      
      setSessions(finalSessions);
      } else {
        setSessions(processedSessions);
      }
      
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [router, currentUserId, pendingSessions]);
  
  // Setup regular polling with 15 second interval - client-side only
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;
    
    // Set initial loading state here to avoid hydration mismatch
    setLoading(true);
    
    // Initial fetch
    fetchSessions().finally(() => {
      // Only update state if component is still mounted
      if (mounted) {
        setLoading(false);
      }
    });
    
    // Set up polling interval - 15 seconds like the Sessions page
    intervalId = setInterval(() => {
      if (mounted) {
        fetchSessions(false);  // Don't show loading on refresh
      }
    }, 15000);
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        fetchSessions(false);
      }
    };
    
    // Add visibility listener to refresh when tab becomes active
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      mounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSessions]);
  
  // Listen for pending-reviews-updated event
  useEffect(() => {
    let mounted = true;
    
    const handlePendingReviewsUpdate = () => {
      if (mounted) {
        fetchSessions(false);  // refresh without showing loading indicator
      }
    };
    
    window.addEventListener('pending-reviews-updated', handlePendingReviewsUpdate);
    
    return () => {
      mounted = false;
      window.removeEventListener('pending-reviews-updated', handlePendingReviewsUpdate);
    };
  }, [fetchSessions]);

  // Memoize filtered sessions
  const filteredSessions = useMemo(() => {
    let filtered = [];
    
    switch (activeTab) {
      case 'upcoming':
        filtered = sessions.filter(session => 
          session.status !== 'cancelled' && 
          session.status !== 'completed' && 
          isFuture(session.date)
        );
        break;
      case 'completed':
        filtered = sessions.filter(session => {
          return session.status === 'completed' || 
                 (session.status !== 'cancelled' && isSessionEnded(session));
        });
        break;
      case 'cancelled':
        filtered = sessions.filter(session => 
          session.status === 'cancelled'
        );
        break;
      default:
        filtered = sessions;
    }
    
    // Sort by date
    if (activeTab === 'upcoming') {
      filtered.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    } else {
      filtered.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }

    return filtered;
  }, [sessions, activeTab, isSessionEnded, isFuture]);

  // Memoize grouped sessions to avoid recalculation on every render
  const groupedSessionsData = useMemo(() => {
    const grouped: Record<string, Session[]> = {};
    
    filteredSessions.forEach(session => {
      const date = new Date(session.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(session);
    });
    
    return grouped;
  }, [filteredSessions]);

  // Other utility functions...
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
    }
  }, []);

  const getUserRole = useCallback((session: Session) => {
    if (session.creator.id === currentUserId) {
      return 'created';
    } else {
      return 'joined';
    }
  }, [currentUserId]);

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  }, []);

  // Memoize the SessionCard component to prevent unnecessary re-renders
  const SessionCard = useCallback(({ session, isCreator }: { session: Session, isCreator: boolean }) => {
    const { date, time } = formatDateTime(session.date);
    const sessionEnded = isSessionEnded(session);
    
    // Determine the status badge color
    let statusBadge = null;
    if (session.status === 'cancelled') {
      statusBadge = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
    } else if (sessionEnded || session.status === 'completed') {
      statusBadge = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Completed</span>;
    } else {
      statusBadge = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
    }
    
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-white">{session.title}</h3>
            {statusBadge}
          </div>
          
          <div className="mb-3">
            <p className="text-sm text-gray-400">
              <span className="inline-block mr-1">📍</span> {session.location.name}
            </p>
            <p className="text-sm text-gray-400">
              <span className="inline-block mr-1">🗓️</span> {date} at {time}
            </p>
            <p className="text-sm text-gray-400">
              <span className="inline-block mr-1">⏱️</span> {formatDuration(session.duration)}
            </p>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
            <div>
              <span className="inline-block mr-1">👥</span> {session.players.length + 1} / {session.maxPlayers} players
            </div>
            {session.isPrivate && (
              <div className="text-gray-500">Private Session</div>
            )}
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/sessions/${session.id}`}
              className="block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center transition-colors"
            >
              View Details
            </Link>
            
            {session.pendingReviews ? (
              <Link
                href={`/sessions/${session.id}#rate-players`}
                className="block w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md text-center transition-colors flex items-center justify-center gap-2 group relative"
              >
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white animate-pulse">
                  !
                </div>
                <div className="flex items-center justify-center gap-2">
                  <FaRegStar className="inline-block text-yellow-300" /> 
                  <span>Rate Players</span>
                </div>
              </Link>
            ) : (sessionEnded || session.status === 'completed') ? (
              <div className="flex items-center justify-center py-2 px-4 bg-gray-700 text-gray-400 rounded-md text-center gap-2">
                <PiConfettiFill className="inline-block text-yellow-400" /> All Players Rated
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }, [formatDateTime, formatDuration]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  const hasUpcomingSessions = Object.keys(groupedSessionsData).length > 0;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">My Sessions</h1>
          <div className="flex items-center">
            {lastRefreshTime && (
              <p className="hidden md:block text-sm text-gray-400 mr-4">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
                <span className="ml-2 text-gray-500">(refreshes every 15s)</span>
              </p>
            )}
          <Link
            href="/sessions/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create Session
          </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'upcoming' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Upcoming
          </button>
          <div className="relative">
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'completed' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Completed
          </button>
            {pendingReviewsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {pendingReviewsCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'cancelled' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Cancelled
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
            <p className="text-gray-400">Loading sessions...</p>
          </div>
        ) : Object.keys(groupedSessionsData).length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-lg">
            <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-400 text-lg">
              {activeTab === 'upcoming' && "You don't have any upcoming sessions"}
              {activeTab === 'completed' && "You don't have any completed sessions"}
              {activeTab === 'cancelled' && "You don't have any cancelled sessions"}
            </p>
            <Link
              href="/sessions"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Browse Available Sessions
            </Link>
          </div>
        ) : (
          <div>
            {Object.entries(groupedSessionsData).map(([monthYear, monthSessions]) => (
              <div key={monthYear} className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">{monthYear}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthSessions.map((session) => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      isCreator={session.creator.id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 