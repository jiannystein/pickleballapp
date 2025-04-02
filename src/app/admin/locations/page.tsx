'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  isApproved: boolean;
  createdAt: string;
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

export default function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationRequests, setLocationRequests] = useState<LocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('approved');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; type: 'location' | 'request' } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLocationsData();
  }, []);

  async function fetchLocationsData() {
    try {
      setLoading(true);
      setError('');
      
      // Fetch locations and location requests in parallel
      const [locationsRes, requestsRes] = await Promise.all([
        fetch('/api/admin/locations'),
        fetch('/api/admin/location-requests')
      ]);
      
      const [locationsData, requestsData] = await Promise.all([
        locationsRes.json(),
        requestsRes.json()
      ]);
      
      if (locationsRes.ok) {
        setLocations(locationsData);
      } else {
        setError('Failed to fetch locations');
      }
      
      if (requestsRes.ok) {
        setLocationRequests(requestsData);
      } else {
        setError('Failed to fetch location requests');
      }
    } catch (err) {
      console.error('Error fetching locations data:', err);
      setError('Failed to load locations data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveRequest(requestId: string) {
    try {
      const res = await fetch(`/api/admin/location-requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'approve'
        })
      });
      
      if (res.ok) {
        // Refresh the data
        fetchLocationsData();
      } else {
        const data = await res.json();
        setError(`Failed to approve request: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error approving location request:', err);
      setError('Failed to approve location request');
    }
  }
  
  async function handleRejectRequest(requestId: string) {
    try {
      const res = await fetch(`/api/admin/location-requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'reject'
        })
      });
      
      if (res.ok) {
        // Refresh the data
        fetchLocationsData();
      } else {
        const data = await res.json();
        setError(`Failed to reject request: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error rejecting location request:', err);
      setError('Failed to reject location request');
    }
  }

  async function handleDeleteLocationRequest(requestId: string) {
    try {
      setDeleteLoading(requestId);
      const res = await fetch(`/api/admin/location-requests/${requestId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setLocationRequests(locationRequests.filter(request => request.id !== requestId));
        setDeleteConfirmation(null);
      } else {
        const data = await res.json();
        setError(`Failed to delete location request: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting location request:', err);
      setError('Failed to delete location request');
    } finally {
      setDeleteLoading(null);
    }
  }

  async function handleDeleteLocation(locationId: string) {
    try {
      setDeleteLoading(locationId);
      const res = await fetch(`/api/admin/locations/${locationId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setLocations(locations.filter(location => location.id !== locationId));
        setDeleteConfirmation(null);
      } else {
        const data = await res.json();
        setError(`Failed to delete location: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location');
    } finally {
      setDeleteLoading(null);
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

  function handleEditLocation(locationId: string) {
    router.push(`/admin/locations/edit/${locationId}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-indigo-400">Loading locations data...</div>
      </div>
    );
  }

  const pendingRequests = locationRequests.filter(req => req.status === 'pending');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Locations Management</h1>
        <p className="text-gray-400">Manage pickleball locations and review new location requests</p>
      </div>

      {error && (
        <div className="bg-red-800/30 border border-red-700 text-red-400 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Approved Locations</p>
              <p className="text-3xl font-bold text-white mt-1">{locations.length}</p>
            </div>
            <div className="p-3 bg-green-900/30 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pending Requests</p>
              <p className="text-3xl font-bold text-white mt-1">{pendingRequests.length}</p>
            </div>
            <div className="p-3 bg-yellow-900/30 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Locations</p>
              <p className="text-3xl font-bold text-white mt-1">{locations.length}</p>
            </div>
            <div className="p-3 bg-indigo-900/30 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex -mb-px">
          <button
            onClick={() => setActiveTab('approved')}
            className={`mr-4 py-2 px-1 font-medium border-b-2 text-sm ${
              activeTab === 'approved'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Approved Locations
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`mr-4 py-2 px-1 font-medium border-b-2 text-sm ${
              activeTab === 'pending'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-indigo-900/50 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Approved Locations Tab */}
      {activeTab === 'approved' && (
        <div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Approved Locations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {locations.length > 0 ? (
                    locations.map(location => (
                      <tr key={location.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-white">{location.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-300">{location.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-300">{formatDate(location.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditLocation(location.id)}
                            className="text-indigo-400 hover:text-indigo-300 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation({ id: location.id, type: 'location' })}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                          {deleteConfirmation?.id === location.id && deleteConfirmation.type === 'location' && (
                            <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded text-red-400 text-xs text-left">
                              Are you sure you want to delete this location?
                              <div className="mt-2 flex space-x-2">
                                <button
                                  onClick={() => handleDeleteLocation(location.id)}
                                  disabled={deleteLoading === location.id}
                                  className={`px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-white ${deleteLoading === location.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {deleteLoading === location.id ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmation(null)}
                                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No approved locations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Pending Location Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {pendingRequests.length > 0 ? (
                    pendingRequests.map(request => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-white">{request.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-300">{request.address}</div>
                          {request.instructions && (
                            <div className="text-gray-500 text-sm mt-1 truncate max-w-xs">
                              {request.instructions.substring(0, 60)}
                              {request.instructions.length > 60 ? '...' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-300">{request.requestedBy.name}</div>
                          <div className="text-gray-500 text-sm">{request.requestedBy.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="text-green-400 hover:text-green-300 mr-4"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No pending location requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 