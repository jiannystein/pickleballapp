'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: User;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserActivities() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  
  // Filter states
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [activityType, setActivityType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const router = useRouter();

  const activityTypes = [
    { value: '', label: 'All Activities' },
    { value: 'SIGN_IN', label: 'Sign In' },
    { value: 'SIGN_OUT', label: 'Sign Out' },
    { value: 'SIGN_UP', label: 'Sign Up' },
    { value: 'CREATE_SESSION', label: 'Create Session' },
    { value: 'JOIN_SESSION', label: 'Join Session' },
    { value: 'DELETE_SESSION', label: 'Delete Session' },
    { value: 'LEAVE_SESSION', label: 'Leave Session' },
    { value: 'ADD_FEEDBACK', label: 'Add Feedback' },
    { value: 'PASSWORD_RESET', label: 'Password Reset' },
    { value: 'PROFILE_UPDATE', label: 'Profile Update' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [pagination.page, selectedUser, activityType, startDate, endDate]);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }

  async function fetchActivities() {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (selectedUser) params.append('userId', selectedUser);
      if (activityType) params.append('activityType', activityType);
      if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);
      
      const res = await fetch(`/api/admin/user-activities?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setActivities(data.activities);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('An error occurred while fetching activities');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  function formatActivityType(type: string) {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function resetFilters() {
    setSelectedUser('');
    setActivityType('');
    setStartDate(null);
    setEndDate(null);
    
    // Reset to first page
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }

  function handlePageChange(newPage: number) {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  }

  function truncateUserAgent(userAgent: string | undefined) {
    if (!userAgent) return 'N/A';
    return userAgent.length > 100 ? userAgent.substring(0, 100) + '...' : userAgent;
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">User Activities</h1>
          <button 
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white text-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-900 text-white p-3 rounded-md mb-6">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Filter */}
            <div>
              <label htmlFor="userFilter" className="block text-sm font-medium text-gray-400 mb-1">User</label>
              <select
                id="userFilter"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Type Filter */}
            <div>
              <label htmlFor="activityFilter" className="block text-sm font-medium text-gray-400 mb-1">Activity Type</label>
              <select
                id="activityFilter"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
              <DatePicker
                id="startDate"
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={endDate || new Date()}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholderText="Select start date"
                dateFormat="yyyy-MM-dd"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
              <DatePicker
                id="endDate"
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                maxDate={new Date()}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholderText="Select end date"
                dateFormat="yyyy-MM-dd"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold">Activity Log</h2>
            <p className="text-gray-400 text-sm mt-1">
              Showing {activities.length} of {pagination.total} activities
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse text-indigo-400">Loading activities...</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Activity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User Agent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {activities.length > 0 ? (
                      activities.map(activity => (
                        <tr key={activity.id} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                                {activity.user?.name.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{activity.user?.name || 'Unknown User'}</div>
                                <div className="text-sm text-gray-400">{activity.user?.email || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              activity.activityType.includes('SIGN_IN') ? 'bg-green-900/30 text-green-400' :
                              activity.activityType.includes('SIGN_UP') ? 'bg-blue-900/30 text-blue-400' :
                              activity.activityType.includes('CREATE') ? 'bg-purple-900/30 text-purple-400' :
                              activity.activityType.includes('JOIN') ? 'bg-indigo-900/30 text-indigo-400' :
                              activity.activityType.includes('DELETE') ? 'bg-red-900/30 text-red-400' :
                              activity.activityType.includes('LEAVE') ? 'bg-orange-900/30 text-orange-400' :
                              activity.activityType.includes('FEEDBACK') ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {formatActivityType(activity.activityType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(activity.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {activity.ipAddress || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                            <span title={activity.userAgent}>{truncateUserAgent(activity.userAgent)}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                          No activities found matching the current filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(1)}
                      className={`px-3 py-1 rounded-md ${pagination.page === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    >
                      First
                    </button>
                    <button
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className={`px-3 py-1 rounded-md ${pagination.page === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    >
                      Previous
                    </button>
                    <div className="px-3 py-1 rounded-md bg-indigo-600 text-white">
                      {pagination.page}
                    </div>
                    <button
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className={`px-3 py-1 rounded-md ${pagination.page === pagination.totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    >
                      Next
                    </button>
                    <button
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.totalPages)}
                      className={`px-3 py-1 rounded-md ${pagination.page === pagination.totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 