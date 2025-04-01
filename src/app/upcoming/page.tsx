'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateTime } from '@/lib/dateUtils';

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
}

export default function UpcomingSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  useEffect(() => {
    fetchSessions();
  }, []);

  // Add a new effect to automatically update session statuses
  useEffect(() => {
    if (sessions.length > 0) {
      const now = new Date();
      // Create a temporary copy with updated statuses
      const updatedSessions = sessions.map(session => {
        // If the session date is in the past and it's not cancelled, mark it as completed
        if (new Date(session.date) < now && session.status !== 'cancelled' && session.status !== 'completed') {
          return { ...session, status: 'completed' };
        }
        return session;
      });
      
      // Only update state if changes were made
      if (JSON.stringify(updatedSessions) !== JSON.stringify(sessions)) {
        setSessions(updatedSessions);
      }
    }
  }, [sessions]);

  async function fetchSessions() {
    try {
      setLoading(true);
      const res = await fetch('/api/sessions/user');
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await res.json();
      console.log('Fetched sessions from API:', data.length);
      
      // Look for specific session
      const targetSession = data.find((s: any) => s.id === 'cm8v69h1c0001760k7ohv2tut');
      if (targetSession) {
        console.log('Target session in API response:', {
          id: targetSession.id,
          title: targetSession.title,
          status: targetSession.status,
          players: targetSession.players?.map((p: any) => p.id)
        });
      } else {
        console.log('Target session not found in API response');
      }
      
      setSessions(data);

      // Get the current user ID
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserId(userData.userId);
        console.log('Current user ID:', userData.userId);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  // Filter sessions by tab
  const getFilteredSessions = () => {
    const now = new Date();
    console.log('Total sessions before filtering:', sessions.length);
    
    // Debug specific session
    const targetSession = sessions.find(s => s.id === 'cm8v69h1c0001760k7ohv2tut');
    if (targetSession) {
      console.log('Found target session:', {
        id: targetSession.id,
        title: targetSession.title,
        status: targetSession.status,
        date: targetSession.date,
        isPast: new Date(targetSession.date) < now
      });
    } else {
      console.log('Target session not found in sessions array');
    }
    
    let filtered = [];
    
    switch (activeTab) {
      case 'upcoming':
        filtered = sessions.filter(session => 
          session.status !== 'cancelled' && 
          session.status !== 'completed' && 
          new Date(session.date) > now
        );
        break;
      case 'completed':
        filtered = sessions.filter(session => {
          const isPast = new Date(session.date) < now;
          return session.status === 'completed' || 
                 (session.status !== 'cancelled' && isPast);
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
    
    console.log(`Filtered ${activeTab} sessions:`, filtered.length);
    
    // Check if the target session is in the filtered array
    if (filtered.length > 0) {
      console.log(`First ${activeTab} session:`, {
        id: filtered[0].id,
        title: filtered[0].title,
        status: filtered[0].status,
        date: filtered[0].date,
        isPast: new Date(filtered[0].date) < now
      });
    }
    
    return filtered;
  };

  // Group sessions by month and day
  const groupedSessions = () => {
    const filtered = getFilteredSessions();

    // Sort by date ascending for upcoming, descending for past
    if (activeTab === 'upcoming') {
      filtered.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    } else {
      filtered.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }

    const grouped: Record<string, Session[]> = {};
    
    filtered.forEach(session => {
      const date = new Date(session.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(session);
    });
    
    return grouped;
  };

  // Format duration in hours and minutes
  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
    }
  }

  // Determine if user created or joined the session
  function getUserRole(session: Session) {
    if (session.creator.id === currentUserId) {
      return 'created';
    } else {
      return 'joined';
    }
  }

  // Function to format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  };

  // Session Card Component
  const SessionCard = ({ session, isCreator }: { session: Session, isCreator: boolean }) => {
    const { date, time } = formatDateTime(session.date);
    const isPastSession = new Date(session.date) < new Date();
    const router = useRouter();
    
    // Determine the status badge color
    let statusBadge = null;
    if (session.status === 'cancelled') {
      statusBadge = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
    } else if (isPastSession || session.status === 'completed') {
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
          
          <div className="mt-4">
            <Link
              href={`/sessions/${session.id}`}
              className="block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  };

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

  const groupedSessionsData = groupedSessions();
  const hasUpcomingSessions = Object.keys(groupedSessionsData).length > 0;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">My Sessions</h1>
          <Link
            href="/sessions/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create Session
          </Link>
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
        ) : Object.keys(groupedSessions()).length === 0 ? (
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
            {Object.entries(groupedSessions()).map(([monthYear, monthSessions]) => (
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