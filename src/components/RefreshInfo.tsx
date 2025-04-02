'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

interface RefreshInfoProps {
  lastRefreshTime: Date | null;
  onRefresh: () => Promise<void>;
  refreshInterval: number; // in seconds
}

export default function RefreshInfo({ lastRefreshTime, onRefresh, refreshInterval }: RefreshInfoProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle refresh button click
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      // Delay resetting the state to show the animation
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setIsRefreshing(false);
        }
      }, 500);
    }
  };
  
  // Clean up any pending state updates when unloading the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      setIsRefreshing(false);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Format the last refresh time
  const formattedTime = lastRefreshTime
    ? lastRefreshTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Never';
  
  return (
    <div className="hidden md:flex items-center justify-start gap-3 text-sm text-gray-400 mb-4">
      <div>
        Last updated: <span className="font-medium">{formattedTime}</span>
        <span className="ml-2 text-gray-500">(auto-refreshes every {refreshInterval}s)</span>
      </div>
      
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`flex items-center justify-center p-1.5 rounded-full 
          ${isRefreshing ? 'bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} 
          transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        aria-label="Refresh data"
      >
        <FiRefreshCw 
          className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} 
        />
      </button>
    </div>
  );
} 