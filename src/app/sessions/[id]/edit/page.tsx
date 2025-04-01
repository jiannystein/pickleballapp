'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { preserveLocalDateTime } from '@/lib/dateUtils';

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
}

interface Session {
  id: string;
  title: string;
  description?: string;
  locationId: string;
  location: Location;
  date: string;
  duration: number;
  maxPlayers: number;
  status: string;
  lookingForPlayers: boolean;
  lookingForTeams: boolean;
  price?: string;
  paymentMethod?: string;
  contactInfo?: string;
}

export default function EditSession() {
  const router = useRouter();
  const params = useParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionFound, setSessionFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    locationId: '',
    maxPlayers: 4,
    duration: 60,
    lookingForPlayers: false,
    lookingForTeams: false,
    price: '',
    paymentMethod: '',
    contactInfo: ''
  });
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchSession();
    }
  }, [currentUserId, params.id]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = locations.filter(location => 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchTerm, locations]);

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok) {
        setCurrentUserId(data.userId);
      } else {
        router.push('/auth/login');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      router.push('/auth/login');
    }
  }

  async function fetchSession() {
    try {
      if (!params.id) {
        setError('Session ID is required');
        setLoadingSession(false);
        return;
      }

      const res = await fetch(`/api/sessions/${params.id}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Session not found');
        } else {
          setError('Failed to fetch session details');
        }
        setLoadingSession(false);
        return;
      }
      
      const sessionData: Session = await res.json();
      setSessionFound(true);
      setSessionData(sessionData);

      // Check if session is completed (date is in the past)
      const sessionDate = new Date(sessionData.date);
      const isSessionCompleted = sessionDate < new Date();
      setIsSessionCompleted(isSessionCompleted);

      if (isSessionCompleted) {
        setError('This session is completed and cannot be edited');
        // Still allow access to see the form, but editing will be disabled
        // setIsAuthorized(false);
        // setLoadingSession(false);
        // return;
      }

      // Fetch session creator info
      const creatorRes = await fetch(`/api/sessions/${params.id}/creator`);
      if (!creatorRes.ok) {
        setError('Failed to verify session ownership');
        setLoadingSession(false);
        return;
      }

      const creatorData = await creatorRes.json();
      const isCreator = creatorData.id === currentUserId;
      
      if (!isCreator) {
        setError('You are not authorized to edit this session');
        setIsAuthorized(false);
        setLoadingSession(false);
        return;
      }

      setIsAuthorized(true);

      // Set form data from session
      setFormData({
        title: sessionData.title,
        locationId: sessionData.locationId,
        maxPlayers: sessionData.maxPlayers,
        duration: sessionData.duration,
        lookingForPlayers: sessionData.lookingForPlayers,
        lookingForTeams: sessionData.lookingForTeams,
        price: sessionData.price || '',
        paymentMethod: sessionData.paymentMethod || '',
        contactInfo: sessionData.contactInfo || ''
      });

      // Set the date
      setDateTime(new Date(sessionData.date));

      // Set selected location
      if (sessionData.location) {
        setSelectedLocation(sessionData.location);
        setSearchTerm(`${sessionData.location.name} - ${sessionData.location.address}`);
      }

      setLoadingSession(false);
    } catch (err) {
      setError('An error occurred while fetching session details');
      setLoadingSession(false);
    }
  }

  async function fetchLocations() {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setLocations(data);
        setFilteredLocations(data);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (selectedLocation && e.target.value !== `${selectedLocation.name} - ${selectedLocation.address}`) {
      setSelectedLocation(null);
      setFormData(prev => ({ ...prev, locationId: '' }));
    }
  }

  function clearLocation() {
    setSearchTerm('');
    setSelectedLocation(null);
    setFormData(prev => ({ ...prev, locationId: '' }));
    setShowDropdown(true);
  }

  function selectLocation(location: Location) {
    setSelectedLocation(location);
    setFormData(prev => ({ ...prev, locationId: location.id }));
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    // Include the required fields (locationId, date, duration) even though they're not editable in the UI
    const sessionData = {
      title: formData.title,
      locationId: formData.locationId, // Include this required field
      date: dateTime ? preserveLocalDateTime(dateTime) : undefined, // Include this required field
      maxPlayers: Number(formData.maxPlayers),
      duration: Number(formData.duration), // Include this even though it's not editable
      lookingForPlayers: formData.lookingForPlayers,
      lookingForTeams: formData.lookingForTeams,
      price: formData.price || null,
      paymentMethod: formData.paymentMethod || null,
      contactInfo: formData.contactInfo || null,
      status: 'active'
    };

    try {
      const res = await fetch(`/api/sessions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to update session');
      }

      router.push(`/sessions/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function cancelSession() {
    try {
      setSaving(true);
      console.log(`Attempting to cancel session: ${params.id}`);
      
      // First, verify we are correctly authenticated
      const meResponse = await fetch('/api/auth/me');
      const meData = await meResponse.json();
      
      if (!meResponse.ok) {
        console.error('Authentication check failed:', meData);
        throw new Error('Authentication error. Please try logging in again.');
      }
      
      console.log('Current authenticated user:', meData);
      
      const res = await fetch(`/api/sessions/${params.id}/cancel`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
      });

      const responseData = await res.json();
      console.log('Cancel response:', res.status, responseData);

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to cancel session');
      }

      router.push('/sessions');
    } catch (err) {
      console.error('Error during session cancellation:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while cancelling session');
    } finally {
      setSaving(false);
      setShowCancelConfirm(false);
    }
  }

  // Filter out past dates for the date picker
  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (loading || loadingSession) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="animate-pulse flex justify-center my-8">
              <div className="h-12 w-12 bg-indigo-500 rounded-full"></div>
            </div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionFound || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Error</h2>
            <div className="mt-4 bg-red-900 border border-red-700 text-white px-4 py-3 rounded">
              {error || "You don't have permission to edit this session"}
            </div>
            <div className="mt-6">
              <Link href="/sessions" className="text-indigo-400 hover:text-indigo-300">
                Back to Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Edit Session</h2>
        </div>

        {isSessionCompleted && (
          <div className="my-6 bg-yellow-900 text-white py-4 px-4 text-center shadow-md rounded-lg">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center mb-2">
                <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold">This Session Has Completed</h2>
              </div>
              <p className="text-base">This session has already taken place and cannot be edited.</p>
              <Link 
                href={`/sessions/${params.id}`}
                className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Session Details
              </Link>
            </div>
          </div>
        )}

        {sessionData?.status === 'cancelled' && (
          <div className="my-6 bg-red-900 text-white py-4 px-4 text-center shadow-md rounded-lg">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center mb-2">
                <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <h2 className="text-xl font-bold">This Session Has Been Cancelled</h2>
              </div>
              <p className="text-base">This session is no longer available and cannot be edited.</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-200">
                Session Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleInputChange}
                disabled={isSessionCompleted || sessionData?.status === 'cancelled'}
                className={`mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  (isSessionCompleted || sessionData?.status === 'cancelled') ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                placeholder="Enter session title"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-200">
                Location
              </label>
              <div className="mt-1">
                <input
                  id="location"
                  type="text"
                  value={selectedLocation ? `${selectedLocation.name} - ${selectedLocation.address}` : ''}
                  className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm opacity-70 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-yellow-500 mt-1">Location cannot be changed after session creation.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-200">
                  Date & Time
                </label>
                <div className="mt-1">
                  <DatePicker
                    id="date"
                    selected={dateTime}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm opacity-70 cursor-not-allowed"
                    placeholderText="Select a date and time"
                    disabled={true}
                  />
                  <p className="text-xs text-yellow-500 mt-1">Date and time cannot be changed after session creation.</p>
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-200">
                  Duration (minutes)
                </label>
                <div className="mt-1">
                  <select
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm opacity-70 cursor-not-allowed"
                    disabled={true}
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                    <option value="150">2.5 hours</option>
                    <option value="180">3 hours</option>
                  </select>
                  <p className="text-xs text-yellow-500 mt-1">Duration cannot be changed after session creation.</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-200">
                Max Players
              </label>
              <select
                id="maxPlayers"
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="2">2 players</option>
                <option value="4">4 players</option>
                <option value="6">6 players</option>
                <option value="8">8 players</option>
                <option value="10">10 players</option>
                <option value="12">12 players</option>
                <option value="14">14 players</option>
                <option value="16">16 players</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="lookingForPlayers"
                  name="lookingForPlayers"
                  type="checkbox"
                  checked={formData.lookingForPlayers}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor="lookingForPlayers" className="ml-2 block text-sm text-gray-200">
                  Looking for players
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="lookingForTeams"
                  name="lookingForTeams"
                  type="checkbox"
                  checked={formData.lookingForTeams}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor="lookingForTeams" className="ml-2 block text-sm text-gray-200">
                  Looking for teams
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-200">
                Price (Optional)
              </label>
              <input
                id="price"
                name="price"
                type="text"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. $10 per person"
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-200">
                Payment Method (Optional)
              </label>
              <input
                id="paymentMethod"
                name="paymentMethod"
                type="text"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g. Cash, Venmo, etc."
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-200">
                Contact Information (Optional)
              </label>
              <textarea
                id="contactInfo"
                name="contactInfo"
                rows={3}
                value={formData.contactInfo}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Any additional contact information"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className={`py-2 px-4 border border-red-700 text-red-500 rounded-md ${
                isSessionCompleted || sessionData?.status === 'cancelled'
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-red-900 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              }`}
              disabled={isSessionCompleted || sessionData?.status === 'cancelled'}
            >
              Cancel Session
            </button>
            <div className="flex space-x-4">
              <Link 
                href={`/sessions/${params.id}`}
                className="py-2 px-4 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </Link>
              <button
                type="submit"
                disabled={saving || isSessionCompleted || sessionData?.status === 'cancelled'}
                className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (saving || isSessionCompleted || sessionData?.status === 'cancelled') ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Cancel Session?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel this session? This action cannot be undone.
              Players who have joined will be notified, and the session will no longer appear in the main listings.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
              >
                No, Keep Session
              </button>
              <button
                type="button"
                onClick={cancelSession}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {saving ? 'Cancelling...' : 'Yes, Cancel Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
