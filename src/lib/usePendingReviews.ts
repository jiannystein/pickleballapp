import { useState, useEffect, useCallback } from 'react';

// Create a debug flag to control logging
const DEBUG = process.env.NODE_ENV === 'development' && false; // Set to true only when debugging

/**
 * Custom hook for managing pending reviews
 * This provides a consistent way to fetch and update pending reviews across components
 */
export function usePendingReviews() {
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Function to fetch pending reviews
  const fetchPendingReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (DEBUG) console.log('usePendingReviews: Fetching pending reviews...');
      
      const res = await fetch('/api/sessions/pending-reviews', {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch pending reviews: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (DEBUG) console.log('usePendingReviews: Pending reviews data:', data);
      
      setPendingReviewsCount(data.totalPendingReviews);
      setPendingSessions(data.sessions || []);
      setLastFetchTime(new Date());
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching pending reviews:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to notify all components about pending reviews update
  const notifyPendingReviewsUpdate = useCallback(() => {
    if (DEBUG) console.log('usePendingReviews: Dispatching pending-reviews-updated event');
    const event = new CustomEvent('pending-reviews-updated');
    window.dispatchEvent(event);
  }, []);

  // Listen for pending-reviews-updated events and set up polling
  useEffect(() => {
    const handlePendingReviewsUpdate = () => {
      if (DEBUG) console.log('usePendingReviews: Received pending-reviews-updated event');
      fetchPendingReviews();
    };
    
    window.addEventListener('pending-reviews-updated', handlePendingReviewsUpdate);
    
    // Initial fetch
    fetchPendingReviews();
    
    // Set up a polling interval to periodically refresh pending reviews
    // This ensures all components using this hook stay in sync
    const pollingInterval = setInterval(() => {
      fetchPendingReviews();
    }, 10000); // Poll every 10 seconds
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingReviews();
      }
    };
    
    // Add visibility listener to refresh when tab becomes active
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('pending-reviews-updated', handlePendingReviewsUpdate);
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchPendingReviews]);

  return {
    pendingReviewsCount,
    pendingSessions,
    isLoading,
    error,
    lastFetchTime,
    fetchPendingReviews,
    notifyPendingReviewsUpdate
  };
}

export default usePendingReviews; 