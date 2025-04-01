'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState<{ id: string; message: string; password?: string } | null>(null);
  const [adminToggleLoading, setAdminToggleLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminStatus(userId: string, currentStatus: boolean) {
    try {
      setAdminToggleLoading(userId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, isAdmin: !currentStatus } : user
        ));
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('An error occurred while updating user');
    } finally {
      setAdminToggleLoading(null);
    }
  }

  async function resetPassword(userId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResetMessage({
          id: userId,
          message: 'Password reset successfully',
          password: data.tempPassword
        });
        
        // Clear the message after 30 seconds
        setTimeout(() => {
          setResetMessage(null);
        }, 30000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('An error occurred while resetting password');
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      setDeleteLoading(userId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUsers(users.filter(user => user.id !== userId));
        setDeleteConfirmation(null);
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('An error occurred while deleting user');
    } finally {
      setDeleteLoading(null);
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>
          <div className="animate-pulse text-indigo-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
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

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
          <div className="mb-4">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                id="search"
                className="block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Admin Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.isAdmin ? 'bg-indigo-900/30 text-indigo-400' : 'bg-gray-700 text-gray-400'}`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                        disabled={adminToggleLoading === user.id}
                        className={`text-indigo-400 hover:text-indigo-300 mr-4 ${adminToggleLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {adminToggleLoading === user.id ? 'Updating...' : user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => resetPassword(user.id)}
                        className="text-indigo-400 hover:text-indigo-300 mr-4"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation(user.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                      {deleteConfirmation === user.id && (
                        <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded text-red-400 text-xs text-left">
                          Are you sure you want to delete this user?
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleteLoading === user.id}
                              className={`px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-white ${deleteLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {deleteLoading === user.id ? 'Deleting...' : 'Confirm'}
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
                      {resetMessage && resetMessage.id === user.id && (
                        <div className="mt-2 p-2 bg-green-900/30 border border-green-800 rounded text-green-400 text-xs text-left">
                          {resetMessage.message}
                          {resetMessage.password && (
                            <div className="mt-1">
                              Temporary password: <span className="font-mono bg-gray-800 px-1 py-0.5 rounded">{resetMessage.password}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                      {searchTerm ? 'No users found matching your search' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 