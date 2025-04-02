'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { preserveLocalDateTime, createLocalISOString } from '@/lib/dateUtils';

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  bookingUrl?: string;
}

// Add this function to create a shared event for session updates
function createSessionCreatedEvent() {
  const sessionCreatedEvent = new CustomEvent('session-created', {
    detail: { timestamp: new Date().getTime() }
  });
  window.dispatchEvent(sessionCreatedEvent);
}

export default function CreateSession() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [invalidDateSelected, setInvalidDateSelected] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    locationId: '',
    maxPlayers: 4,
    duration: 60,
    lookingForPlayers: false,
    lookingForTeams: false,
    price: '',
    paymentMethod: '',
    contactInfo: '',
    isPrivate: false
  });
  const [showGameDetails, setShowGameDetails] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

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
    setLoading(true);

    if (!dateTime) {
      setError('Please select a date and time');
      setLoading(false);
      return;
    }
    
    const dateString = createLocalISOString(dateTime);
    
    const sessionData = {
      title: formData.title,
      locationId: formData.locationId,
      date: dateString,
      maxPlayers: Number(formData.maxPlayers),
      duration: Number(formData.duration),
      lookingForPlayers: formData.lookingForPlayers,
      lookingForTeams: formData.lookingForTeams,
      price: formData.price || null,
      paymentMethod: formData.paymentMethod || null,
      contactInfo: formData.contactInfo || null,
      isPrivate: formData.isPrivate
    };

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create session');
      }

      // Dispatch the event to notify other components that a session was created
      createSessionCreatedEvent();
      
      // Navigate to sessions page
      router.push('/sessions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const isDateTimeValid = (date: Date) => {
    const now = new Date();
    return date > now;
  };
  
  const isDateInPast = (date: Date) => {
    const now = new Date();
    
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const maxDate = new Date(nowDate);
    maxDate.setDate(nowDate.getDate() + 14);
    
    return compareDate < nowDate || compareDate > maxDate;
  };
  
  const filterTime = (time: Date) => {
    const now = new Date();
    
    const isToday = time.getDate() === now.getDate() && 
                   time.getMonth() === now.getMonth() && 
                   time.getFullYear() === now.getFullYear();
                   
    if (isToday) {
      return time > now;
    }
    
    return true;
  };
  
  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const isValid = isDateTimeValid(date);
      setInvalidDateSelected(!isValid);
      if (isValid) {
        setDateTime(date);
      }
    } else {
      setDateTime(null);
      setInvalidDateSelected(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Create a New Session</h2>
        </div>

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
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter session title"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-200">
                Location
              </label>
              <div className="relative">
                {!selectedLocation ? (
                  <div className="flex">
                    <input
                      id="location"
                      type="text"
                      required
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(true)}
                      className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search for a location"
                    />
                  </div>
                ) : (
                  <div className="mt-1 relative">
                    <div className="block w-full p-3 bg-gray-800 border border-gray-700 rounded-md shadow-sm text-white">
                      <div className="pr-8">
                        <p className="font-medium text-indigo-400">{selectedLocation.name}</p>
                        <p className="text-gray-300 text-sm mt-1 whitespace-pre-line">{selectedLocation.address}</p>
                        {selectedLocation.instructions && (
                          <div className="mt-2 text-gray-400 text-xs whitespace-pre-line">
                            <p className="font-medium text-indigo-300 text-xs mb-1">Instructions:</p>
                            {selectedLocation.instructions}
                          </div>
                        )}
                        {selectedLocation.bookingUrl && (
                          <div className="mt-3 mb-1">
                            <a 
                              href={selectedLocation.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded bg-indigo-900 text-indigo-200 hover:bg-indigo-800 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Book this location
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={clearLocation}
                        className="absolute top-3 right-3 text-gray-400 hover:text-white"
                        aria-label="Clear location"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {showDropdown && !selectedLocation && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 shadow-lg rounded-md overflow-auto max-h-60">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map(location => (
                        <div
                          key={location.id}
                          onClick={() => selectLocation(location)}
                          className="p-2 hover:bg-gray-700 cursor-pointer text-white"
                        >
                          <div>{location.name}</div>
                          <div className="text-xs text-gray-400">{location.address}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-white">
                        No locations found.
                      </div>
                    )}
                    <div className="p-2 border-t border-gray-700">
                      <Link
                        href="/locations/request"
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        Can't find your location? Request a new one
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="dateTime" className="block text-sm font-medium text-gray-200">
                Date & Time
              </label>
              <div className="mt-1 relative">
                <DatePicker
                  selected={dateTime}
                  onChange={handleDateChange}
                  filterDate={(date) => !isDateInPast(date)}
                  filterTime={filterTime}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={60}
                  timeCaption="Time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className={`block w-full px-3 py-2 bg-gray-800 border ${invalidDateSelected ? 'border-red-500' : 'border-gray-700'} rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholderText="Select date and time"
                  required
                  minDate={new Date()}
                  popperClassName="react-datepicker-dark"
                  calendarClassName="dark-calendar"
                  showPopperArrow={false}
                />
              </div>
              {invalidDateSelected ? (
                <p className="mt-1 text-xs text-red-400">
                  Please select a future date and time.
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Select a date within the next 14 days.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-200">
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              >
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
                <option value="300">5 hours</option>
                <option value="360">6 hours</option>
              </select>
            </div>

            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-200">
                Maximum Players
              </label>
              <input
                id="maxPlayers"
                name="maxPlayers"
                type="number"
                min="2"
                max="16"
                required
                value={formData.maxPlayers}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter maximum number of players"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Session Privacy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-lg border ${!formData.isPrivate ? 'border-indigo-500 bg-gray-800' : 'border-gray-700 bg-gray-900'} cursor-pointer transition-colors`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${!formData.isPrivate ? 'bg-indigo-500' : 'bg-gray-700'}`}></div>
                    <span className="font-medium text-white">Public Session</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Anyone can join this session without approval.
                  </p>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border ${formData.isPrivate ? 'border-indigo-500 bg-gray-800' : 'border-gray-700 bg-gray-900'} cursor-pointer transition-colors`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-2 ${formData.isPrivate ? 'bg-indigo-500' : 'bg-gray-700'}`}></div>
                    <span className="font-medium text-white">Private Session</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Players must request to join and wait for your approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <button
                type="button" 
                onClick={() => setShowGameDetails(!showGameDetails)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center text-sm font-medium"
              >
                <span>Game Details</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ml-1 transition-transform duration-200 ${showGameDetails ? 'rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showGameDetails && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center">
                    <input
                      id="lookingForPlayers"
                      name="lookingForPlayers"
                      type="checkbox"
                      checked={formData.lookingForPlayers}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                    />
                    <label htmlFor="lookingForPlayers" className="ml-2 block text-sm text-gray-300">
                      Looking for more players
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
                    <label htmlFor="lookingForTeams" className="ml-2 block text-sm text-gray-300">
                      Looking for more teams
                    </label>
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-200">
                      Price (if any)
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
                      Payment Method
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
                      Contact Information
                    </label>
                    <textarea
                      id="contactInfo"
                      name="contactInfo"
                      rows={3}
                      value={formData.contactInfo}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g. Contact me at 555-1234 for questions"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <Link
              href="/sessions"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              Back to Sessions
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.locationId || !dateTime}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                loading || !formData.locationId || !dateTime
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 