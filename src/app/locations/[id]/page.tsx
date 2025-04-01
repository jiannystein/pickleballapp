'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  date: string;
  maxPlayers: number;
  players: any[];
  creator: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  bookingUrl?: string;
  photoUrl?: string;
  availableSessions?: Session[];
}

export default function LocationDetailPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;

  useEffect(() => {
    fetchLocationDetails();
  }, [locationId]);

  async function fetchLocationDetails() {
    try {
      setLoading(true);
      setError('');
      
      // Fetch location details
      const res = await fetch(`/api/locations/${locationId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch location details');
      }
      
      const locationData = await res.json();
      
      // Fetch available sessions for this location
      const sessionsRes = await fetch(`/api/locations/${locationId}/sessions`);
      let sessionsData = [];
      
      if (sessionsRes.ok) {
        sessionsData = await sessionsRes.json();
      }
      
      setLocation({
        ...locationData,
        availableSessions: sessionsData
      });
      
    } catch (err) {
      console.error('Error fetching location details:', err);
      setError('Failed to load location details');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse text-indigo-400">Loading location details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-red-400">{error || 'Location not found'}</p>
            <div className="mt-6">
              <Link 
                href="/locations"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Locations
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/locations"
            className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Locations
          </Link>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {location.photoUrl && (
            <div className="relative h-72 w-full">
              <Image
                src={location.photoUrl}
                alt={location.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
            </div>
          )}
          
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-white mb-3">{location.name}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Location Details</h2>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-indigo-400 mb-1">Address</p>
                    <p className="text-gray-300 whitespace-pre-line">{location.address}</p>
                  </div>
                  
                  {location.instructions && (
                    <div>
                      <p className="text-sm font-medium text-indigo-400 mb-1">Instructions</p>
                      <p className="text-gray-300 whitespace-pre-line">{location.instructions}</p>
                    </div>
                  )}
                  
                  {location.bookingUrl && (
                    <div>
                      <p className="text-sm font-medium text-indigo-400 mb-2">Booking</p>
                      <a 
                        href={location.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Book this location
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <p className="text-xs text-gray-400 mt-2">
                        This link will take you to the official booking page for this location
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Upcoming Sessions</h2>
                  <Link 
                    href={`/sessions/create?locationId=${location.id}`}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    + Create Session
                  </Link>
                </div>
                
                {location.availableSessions && location.availableSessions.length > 0 ? (
                  <div className="space-y-4">
                    {location.availableSessions.map((session) => (
                      <Link 
                        key={session.id}
                        href={`/sessions/${session.id}`}
                        className="block bg-gray-700 hover:bg-gray-650 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-white">{session.title}</h3>
                            <p className="text-gray-300 text-sm mt-1">
                              {formatDate(session.date)} at {formatTime(session.date)}
                            </p>
                          </div>
                          <div className="text-sm text-gray-400">
                            {session.players.length}/{session.maxPlayers} players
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-700 rounded-lg p-6 text-center">
                    <p className="text-gray-300 mb-4">No upcoming sessions at this location</p>
                    <Link
                      href={`/sessions/create?locationId=${location.id}`}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create First Session
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 