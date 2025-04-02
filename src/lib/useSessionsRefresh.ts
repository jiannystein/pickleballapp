import { useState, useEffect, useCallback } from 'react';

interface Session {
  id: string;
  title: string;
  description: string | null;
  location: {
    id: string;
    name: string;
    address: string;
    photoUrl: string | null;
  };
  date: string;
  maxPlayers: number;
  players: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }[];
  creator: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  status?: string;
  isPrivate: boolean;
  pendingRequestsCount?: number;
  duration?: number;
}

interface UseSessionsRefreshOptions {
  refreshInterval?: number; // in milliseconds, default 10000 (10s)
  onError?: (error: Error) => void;
  initialFetch?: boolean; // whether to fetch immediately on mount
}

/**
 * Custom hook for refreshing sessions data with auto-refresh capability
 * Also handles initializing pending reviews for completed sessions
 */
export default function useSessionsRefresh(options: UseSessionsRefreshOptions = {}) {
  const refreshInterval = options.refreshInterval ?? 10000;
  const onError = options.onError;
  const initialFetch = options.initialFetch ?? true;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(initialFetch);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const fetchSessions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const res = await fetch('/api/sessions', {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      // Check for sessions that need to be marked as completed (past their scheduled time)
      const now = new Date();
      const completedSessionIds: string[] = [];
      
      const updatedSessions = data.map((session: Session) => {
        const sessionDate = new Date(session.date);
        // Add duration to the session date to get the end time
        const sessionEndTime = new Date(sessionDate.getTime() + (session.duration || 60) * 60000);
        
        // If session has ended and is not already completed or cancelled, mark it as completed
        if (sessionEndTime < now && session.status !== 'completed' && session.status !== 'cancelled') {
          completedSessionIds.push(session.id);
          return { ...session, status: 'completed' };
        }
        return session;
      });
      
      // If we have sessions that need to be updated to completed status
      if (completedSessionIds.length > 0) {
        console.log(`Marking ${completedSessionIds.length} sessions as completed`);
        
        // Update sessions in state immediately
        setSessions(updatedSessions);
        
        // Initialize reviews for these sessions
        await Promise.all(completedSessionIds.map(async (sessionId) => {
          try {
            // Call the API to initialize pending reviews
            const initResponse = await fetch(`/api/sessions/${sessionId}/initialize-reviews`, {
              method: 'POST'
            });
            
            if (!initResponse.ok) {
              console.error(`Failed to initialize reviews for session ${sessionId}`);
            } else {
              console.log(`Successfully initialized reviews for session ${sessionId}`);
            }
          } catch (error) {
            console.error(`Error initializing reviews for session ${sessionId}:`, error);
          }
        }));
      }
      
      setSessions(data);
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [onError]);

  // Initial fetch on mount
  useEffect(() => {
    if (initialFetch) {
      fetchSessions();
    }
  }, [fetchSessions, initialFetch]);

  // Set up polling interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    let mounted = true;
    
    const intervalId = setInterval(() => {
      if (mounted) {
        fetchSessions(false); // Don't show loading indicator for background refreshes
      }
    }, refreshInterval);
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        fetchSessions(false);
      }
    };
    
    // Add visibility listener to refresh when tab becomes active
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      mounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSessions, refreshInterval]);

  // Listen for session created events
  useEffect(() => {
    let mounted = true;
    
    const handleSessionCreated = () => {
      if (mounted) {
        console.log('Session created event detected, refreshing sessions...');
        fetchSessions(false);
      }
    };

    // Add event listener
    window.addEventListener('session-created', handleSessionCreated);
    
    // Clean up
    return () => {
      mounted = false;
      window.removeEventListener('session-created', handleSessionCreated);
    };
  }, [fetchSessions]);

  const refreshSessionsNow = useCallback(() => {
    return fetchSessions(true);
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refreshSessions: refreshSessionsNow,
    lastRefreshTime,
    refreshInterval
  };
} 