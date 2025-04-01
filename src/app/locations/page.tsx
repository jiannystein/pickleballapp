'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  bookingUrl?: string;
  photoUrl?: string;
  availableSessions?: Session[];
}

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

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        // Get locations
        setLocations(data);
        
        // For each location, fetch available sessions
        const locationsWithSessions = await Promise.all(
          data.map(async (location: Location) => {
            try {
              const sessionRes = await fetch(`/api/locations/${location.id}/sessions`);
              if (sessionRes.ok) {
                const sessionData = await sessionRes.json();
                return {
                  ...location,
                  availableSessions: sessionData
                };
              }
              return location;
            } catch (err) {
              console.error(`Failed to fetch sessions for location ${location.id}:`, err);
              return location;
            }
          })
        );
        
        setLocations(locationsWithSessions);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function navigateToSessions(locationId: string) {
    router.push(`/locations/${locationId}`);
  }

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

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Locations</h2>
          <p className="mt-4 text-lg text-gray-300">
            Find a place to play pickleball
          </p>
          <div className="mt-8">
            <Link
              href="/locations/request"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Request New Location
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full flex flex-col transition-transform hover:scale-[1.02] hover:shadow-xl hover:bg-gray-750 cursor-pointer"
              onClick={() => navigateToSessions(location.id)}
            >
              {location.photoUrl && (
                <div className="relative h-64 w-full">
                  <Image
                    src={location.photoUrl}
                    alt={location.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
                  <div className="absolute bottom-3 left-6 text-white text-xl font-medium">
                    {location.name}
                  </div>
                  
                  {/* Always visible session counter badge */}
                  {location.availableSessions && location.availableSessions.length > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        {location.availableSessions.length} 
                        <span className="hidden sm:inline ml-1">
                          {location.availableSessions.length === 1 ? 'Session' : 'Sessions'}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className={`p-6 flex-grow ${location.photoUrl ? '' : ''}`}>
                {!location.photoUrl && (
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-medium text-white">{location.name}</h3>
                    
                    {/* Badge for non-photo locations */}
                    {location.availableSessions && location.availableSessions.length > 0 && (
                      <span className="inline-flex items-center bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                        {location.availableSessions.length}
                        <span className="hidden sm:inline ml-1">
                          {location.availableSessions.length === 1 ? 'Session' : 'Sessions'}
                        </span>
                      </span>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-400 mb-1">Address</p>
                    <p className="text-gray-300 whitespace-pre-line">{location.address}</p>
                  </div>
                  
                  {location.instructions && (
                    <div>
                      <p className="text-sm font-semibold text-indigo-400 mb-1">Instructions</p>
                      <p className="text-sm text-gray-400 whitespace-pre-line">
                        {location.instructions}
                      </p>
                    </div>
                  )}
                  
                  {/* View Sessions Button */}
                  {location.availableSessions && location.availableSessions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <div className="text-indigo-400 flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View Available Sessions
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {locations.length === 0 && (
          <p className="mt-8 text-center text-gray-400">
            No locations available yet. Be the first to request one!
          </p>
        )}
      </div>
    </div>
  );
} 