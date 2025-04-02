'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength indicators
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  
  const passwordStrength = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    if (passwordStrength <= 4) return 'Strong';
    return 'Very Strong';
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (field === 'new') {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // Clear the form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 animate-fadeIn">
      <h3 className="text-xl font-medium text-white mb-5 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Change Password
      </h3>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-md mb-4 text-sm animate-fadeIn">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-200 px-4 py-3 rounded-md mb-4 text-sm animate-fadeIn">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Enter your current password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showCurrentPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showNewPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {/* Password strength indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="flex items-center mb-1">
                <div className="text-xs text-gray-400 mr-2">Password Strength:</div>
                <div className="text-xs font-medium" style={{ color: getStrengthColor() === 'bg-red-500' ? '#f87171' : getStrengthColor() === 'bg-yellow-500' ? '#fbbf24' : '#4ade80' }}>
                  {getStrengthLabel()}
                </div>
              </div>
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStrengthColor()}`} 
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                ></div>
              </div>
              
              <ul className="mt-2 space-y-1 text-xs text-gray-400">
                <li className="flex items-center">
                  <span className={hasMinLength ? 'text-green-400' : 'text-gray-500'}>
                    {hasMinLength ? (
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    ) : (
                      <span className="inline-block h-4 w-4 mr-1">•</span>
                    )}
                    At least 8 characters
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={hasUppercase ? 'text-green-400' : 'text-gray-500'}>
                    {hasUppercase ? (
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    ) : (
                      <span className="inline-block h-4 w-4 mr-1">•</span>
                    )}
                    Uppercase letter
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={hasLowercase ? 'text-green-400' : 'text-gray-500'}>
                    {hasLowercase ? (
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    ) : (
                      <span className="inline-block h-4 w-4 mr-1">•</span>
                    )}
                    Lowercase letter
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={hasNumber ? 'text-green-400' : 'text-gray-500'}>
                    {hasNumber ? (
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    ) : (
                      <span className="inline-block h-4 w-4 mr-1">•</span>
                    )}
                    Number
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={hasSpecialChar ? 'text-green-400' : 'text-gray-500'}>
                    {hasSpecialChar ? (
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    ) : (
                      <span className="inline-block h-4 w-4 mr-1">•</span>
                    )}
                    Special character
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-gray-700 border ${
                confirmPassword && newPassword !== confirmPassword
                  ? 'border-red-500' 
                  : confirmPassword && newPassword === confirmPassword
                  ? 'border-green-500'
                  : 'border-gray-600'
              } rounded-md py-2 pl-3 pr-10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm`}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
          )}
          {confirmPassword && newPassword === confirmPassword && (
            <p className="mt-1 text-xs text-green-400 flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-1" /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md hover:bg-indigo-700 transition-colors ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
} 