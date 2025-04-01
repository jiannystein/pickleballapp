'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate, formatTime } from '@/lib/dateUtils';
import UserAvatar from '@/components/UserAvatar';

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  photoUrl?: string;
}

interface JoinRequest {
  id: string;
  sessionId: string;
  status: 'pending' | 'approved' | 'rejected';
  isExpired?: boolean;
}

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
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Portal wrapper component at the top level
const PortalWrapper = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      width: '100vw', 
      height: '100vh', 
      pointerEvents: 'none', 
      zIndex: 9999 
    }}>
      {children}
    </div>
  );
};

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionJoinRequests, setSessionJoinRequests] = useState<Record<string, JoinRequest>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  // Join request state
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  
  // Confirmation dialog state
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState<string | null>(null);
  const [router, searchParams] = [useRouter(), useSearchParams()];
  const locationId = searchParams.get('locationId');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    sessionId: string;
    action: 'join' | 'leave' | 'cancel';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    sessionId: '',
    action: 'join'
  });

  // New function to filter sessions by status
  const getFilteredSessionsByStatus = () => {
    if (!filteredSessions || filteredSessions.length === 0) return [];
    
    const now = new Date();
    
    // Only show active sessions
    return filteredSessions.filter(session => 
      session.status !== 'cancelled' && 
      session.status !== 'completed' && 
      new Date(session.date) > now
    );
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && locationId) {
      const filtered = sessions.filter((session) => session.location.id === locationId);
      setFilteredSessions(filtered);
      
      if (filtered.length > 0) {
        setLocationName(filtered[0].location.name);
      }
    } else {
      setFilteredSessions(sessions);
      setLocationName('');
    }
  }, [sessions, locationId]);

  useEffect(() => {
    if (sessions.length > 0 && currentUserId) {
      const privateSessions = sessions.filter(session => session.isPrivate);
      if (privateSessions.length > 0) {
        fetchJoinRequests(privateSessions);
      }
    }
  }, [sessions, currentUserId]);

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok) {
        setCurrentUserId(data.userId);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  }

  async function fetchSessions() {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function fetchJoinRequests(privateSessions: Session[]) {
    // Only fetch join requests for upcoming sessions the user hasn't joined yet
    const now = new Date();
    const relevantSessions = privateSessions.filter(session => 
      !hasUserJoined(session) && 
      !isCreatedByUser(session)
    );
    
    if (relevantSessions.length === 0) return;
    
    const requests: Record<string, JoinRequest> = {};
    
    // Fetch join requests one by one to build a mapping of sessionId -> request status
    for (const session of relevantSessions) {
      try {
        const res = await fetch(`/api/sessions/${session.id}/requests/user`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            requests[session.id] = data;
          }
        }
      } catch (err) {
        console.error(`Error fetching join request for session ${session.id}:`, err);
      }
    }
    
    setSessionJoinRequests(requests);
  }

  function getJoinRequestStatus(sessionId: string): 'pending' | 'approved' | 'rejected' | null {
    if (!sessionJoinRequests[sessionId]) return null;
    return sessionJoinRequests[sessionId].status;
  }

  function confirmJoinSession(sessionId: string) {
    const session = filteredSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    if (session.isPrivate) {
      // For private sessions, show the join request modal with message input
      setSelectedSessionId(sessionId);
      setJoinRequestMessage('');
      setShowJoinRequestModal(true);
    } else {
      // For public sessions, show the confirmation dialog
      setConfirmDialog({
        isOpen: true,
        title: 'Join Session',
        message: `Are you sure you want to join "${session.title}" on ${formatDate(session.date)} at ${formatTime(session.date)}?`,
        confirmText: 'Join',
        cancelText: 'Cancel',
        sessionId,
        action: 'join'
      });
    }
  }
  
  function confirmLeaveSession(sessionId: string) {
    const session = filteredSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Leave Session',
      message: `Are you sure you want to leave "${session.title}"? Your spot will be available to other players.`,
      confirmText: 'Leave',
      cancelText: 'Stay',
      sessionId,
      action: 'leave'
    });
  }
  
  function closeConfirmDialog() {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: false
    });
  }
  
  async function handleConfirmAction() {
    const { sessionId, action } = confirmDialog;
    
    if (action === 'join') {
      await handleJoinSession(sessionId);
    } else if (action === 'leave') {
      await handleLeaveSession(sessionId);
    } else if (action === 'cancel') {
      await handleCancelJoinRequest(sessionId);
    }
    
    closeConfirmDialog();
  }

  async function handleJoinSession(sessionId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      // Refresh sessions list
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }
  
  async function handleLeaveSession(sessionId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/leave`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to leave session');
      }

      // Refresh sessions list
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleCancelJoinRequest(sessionId: string) {
    try {
      console.log('Canceling join request for session:', sessionId);
      const res = await fetch(`/api/sessions/${sessionId}/requests/user`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await res.json();

      if (!res.ok) {
        console.error('Error response from server:', res.status, data);
        throw new Error(data.error || `Failed to cancel join request: ${res.status} ${res.statusText}`);
      }

      // Show success message
      setError('');
      
      // Refresh sessions and join requests
      fetchSessions();
      
      // Show temporary success message
      setError(`Your join request has been canceled successfully.`);
      setTimeout(() => setError(''), 5000); // Clear after 5 seconds
    } catch (err) {
      console.error('Error canceling join request:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while canceling your request. Please try again.');
    }
  }

  function confirmCancelJoinRequest(sessionId: string) {
    const session = filteredSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Join Request',
      message: `Are you sure you want to cancel your request to join "${session.title}"? The host will no longer see your request.`,
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request',
      sessionId,
      action: 'cancel'
    });
  }

  function hasUserJoined(session: Session): boolean {
    return session.players.some(player => player.id === currentUserId);
  }

  function isCreatedByUser(session: Session): boolean {
    return session.creator.id === currentUserId;
  }

  function clearLocationFilter() {
    router.push('/sessions');
  }

  async function handleSubmitJoinRequest() {
    if (!selectedSessionId) return;
    
    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: joinRequestMessage }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit join request');
      }

      // Clear the form
      setSelectedSessionId(null);
      setJoinRequestMessage('');
      setShowJoinRequestModal(false);
      
      // Refresh sessions and join requests
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  function renderJoinRequestButton(session: Session) {
    const isPastSession = new Date(session.date) < new Date();
    const isPending = getJoinRequestStatus(session.id) === 'pending';
    const isRejected = getJoinRequestStatus(session.id) === 'rejected';
    
    if (isCreatedByUser(session) || hasUserJoined(session) || isPastSession) {
      return null;
    }
    
    if (session.players.length >= session.maxPlayers) {
      return (
        <button
          disabled
          className="mt-3 w-full flex justify-center items-center px-3 py-2 bg-gray-600 text-gray-300 rounded text-sm cursor-not-allowed"
        >
          Session Full
        </button>
      );
    }
    
    if (session.isPrivate) {
      // For private sessions
      if (isPending) {
        return (
          <div className="mt-3 flex flex-col space-y-2">
            <button
              disabled
              className="w-full flex justify-center items-center px-3 py-2 bg-yellow-600 text-white rounded text-sm"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Approval
            </button>
            <button
              onClick={() => confirmCancelJoinRequest(session.id)}
              className="w-full flex justify-center items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Request
            </button>
          </div>
        );
      } else if (isRejected) {
        return (
          <button
            disabled
            className="mt-3 w-full flex justify-center items-center px-3 py-2 bg-red-600 text-white rounded text-sm"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Request Rejected
          </button>
        );
      } else {
        return (
          <button
            onClick={() => confirmJoinSession(session.id)}
            className="mt-3 w-full flex justify-center items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Request to Join
          </button>
        );
      }
    } else {
      // For public sessions
      return (
        <button
          onClick={() => confirmJoinSession(session.id)}
          className="mt-3 w-full flex justify-center items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Join Session
        </button>
      );
    }
  }

  function renderSessionCard(session: Session) {
    // Determine if the current user is the host
    const isHost = isCreatedByUser(session);
    
    // Check if this session has pending requests (for hosts only)
    const hasPendingRequests = isHost && session.pendingRequestsCount && session.pendingRequestsCount > 0;
    
    // Get user-specific status for this session
    const joined = hasUserJoined(session);
    const userRequestStatus = joined ? null : getJoinRequestStatus(session.id);
    
    // Determine card border class based on special conditions
    let cardBorderClass = "border border-gray-700";
    let cardOverlayClass = "";
    
    if (hasPendingRequests) {
      // Only add special styling for hosts with pending requests
      cardBorderClass = "border border-gray-700 relative host-pending-requests";
    } else if (isHost) {
      // Session is created by the current user (host) with no pending requests
      cardBorderClass = "border border-gray-700 relative host-session";
    } else if (joined) {
      cardBorderClass = "border border-gray-700 relative joined-session";
    } else if (userRequestStatus === 'pending') {
      cardBorderClass = "border border-gray-700 relative pending-approval";
    }

    // Add overlay and styling for cancelled or past sessions
    if (session.status === 'cancelled') {
      cardOverlayClass = "opacity-70";
      cardBorderClass = "border border-red-800 relative";
    } else if (new Date(session.date) < new Date()) {
      cardOverlayClass = "opacity-70";
      cardBorderClass = "border border-gray-600 relative";
    }
    
    return (
      <div 
        key={session.id} 
        className={`relative bg-gray-800 shadow rounded-lg overflow-visible hover:shadow-lg transition-shadow ${cardBorderClass} ${cardOverlayClass}`}
      >
        {/* Status badges container */}
        <div className="absolute top-0 right-0 z-10 flex flex-row-reverse">
          {/* Show pending requests badge if there are any */}
          {hasPendingRequests && (
            <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-bl-md">
              {session.pendingRequestsCount} pending {session.pendingRequestsCount === 1 ? 'request' : 'requests'}
            </div>
          )}
          
          {/* Show hosted by you badge if user is host */}
          {isHost && (
            <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-bl-md">
              Hosted by you
            </div>
          )}
        </div>
        
        {/* Show joined badge if user has joined but is not the host */}
        {joined && !isHost && (
          <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-bl-md z-10">
            Joined
          </div>
        )}
        
        {/* Show pending approval badge if user has a pending request */}
        {userRequestStatus === 'pending' && (
          <div className="absolute top-0 right-0 bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-bl-md z-10">
            Pending Approval
          </div>
        )}
        
        {/* Location photo with gradient overlay */}
        {session.location.photoUrl && (
          <div className="relative h-32 w-full">
            <Image
              src={session.location.photoUrl}
              alt={session.location.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
            <div className="absolute bottom-2 left-4 text-white font-medium">
              {session.location.name}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-white">
              {session.title}
            </h3>
            <div className="flex items-center space-x-2">
              {session.isPrivate ? (
                <span className="bg-purple-900 text-purple-100 text-xs px-2 py-1 rounded-full flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private
                </span>
              ) : (
                <span className="bg-blue-900 text-blue-100 text-xs px-2 py-1 rounded-full flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Public
                </span>
              )}
              {session.status === 'cancelled' && (
                <span className="bg-red-900 text-red-100 text-xs px-2 py-1 rounded">
                  Cancelled
                </span>
              )}
              {new Date(session.date) < new Date() && session.status !== 'cancelled' && (
                <span className="bg-yellow-700 text-yellow-100 text-xs px-2 py-1 rounded">
                  Completed
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-indigo-400">Date</p>
              <p className="text-gray-300">{formatDate(session.date)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-indigo-400">Time</p>
              <p className="text-gray-300">{formatTime(session.date)}</p>
            </div>
            {!session.location.photoUrl && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-indigo-400">Location</p>
                <p className="text-gray-300 truncate">{session.location.name}</p>
              </div>
            )}
          </div>

          {/* Player avatars section with improved spacing */}
          <div className="mt-6 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-indigo-400">Players</p>
              <span className="text-xs font-medium text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                {session.players.length + 1}/{session.maxPlayers}
              </span>
            </div>
            <div className="flex items-start flex-wrap gap-3 min-h-[68px]">
              {/* Creator avatar with improved indicator */}
              <div className="relative group shrink-0">
                <UserAvatar
                  name={session.creator.name}
                  imageUrl={session.creator.avatarUrl}
                  userId={session.creator.id}
                  showPlayerCard={true}
                  size={44}
                  playerCardTrigger="hover"
                  playerCardPosition="right"
                  portalId="player-card-portal"
                />
                <span className="absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full ring-2 ring-gray-800 bg-yellow-400"></span>
              </div>

              {/* Player avatars with consistent spacing */}
              {session.players.filter(player => player.id !== session.creator.id).map((player) => (
                <div key={player.id} className="relative group shrink-0">
                  <UserAvatar
                    name={player.name}
                    imageUrl={player.avatarUrl}
                    userId={player.id}
                    showPlayerCard={true}
                    size={44}
                    playerCardTrigger="hover"
                    playerCardPosition="right"
                    portalId="player-card-portal"
                  />
                </div>
              ))}

              {/* Empty player slots with improved visual */}
              {Array.from({ length: session.maxPlayers - (session.players.length + 1) }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  onClick={() => {
                    if (!hasUserJoined(session) && !isCreatedByUser(session) && session.status !== 'cancelled') {
                      confirmJoinSession(session.id);
                    }
                  }}
                  className={`relative z-10 inline-flex items-center justify-center w-11 h-11 rounded-full border-2 border-dashed border-gray-600/50 bg-gray-800/30 backdrop-blur-sm transition-all duration-200 shrink-0 ${
                    !hasUserJoined(session) && !isCreatedByUser(session) && session.status !== 'cancelled' 
                      ? 'cursor-pointer hover:border-indigo-400/70 hover:bg-gray-800/50 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10' 
                      : ''
                  }`}
                  title="Open Spot"
                >
                  <div className="relative w-5 h-5">
                    {/* Horizontal line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-500/70 transform -translate-y-1/2 group-hover:bg-indigo-400/70 transition-colors duration-200"></div>
                    {/* Vertical line */}
                    <div className="absolute top-0 left-1/2 h-full w-0.5 bg-gray-500/70 transform -translate-x-1/2 group-hover:bg-indigo-400/70 transition-colors duration-200"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col space-y-2.5">
            {isCreatedByUser(session) ? (
              <div className="flex items-center justify-center">
                <Link
                  href={session.status === 'cancelled' || new Date(session.date) < new Date() 
                    ? `/sessions/${session.id}` 
                    : `/sessions/${session.id}/edit`}
                  className={`flex-1 py-2 px-4 text-center rounded-md ${
                    session.status === 'cancelled' || new Date(session.date) < new Date()
                      ? 'bg-gray-700 text-gray-400 cursor-pointer'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {session.status === 'cancelled' 
                    ? 'Cancelled' 
                    : new Date(session.date) < new Date()
                    ? 'Completed'
                    : 'Edit Session'}
                </Link>
              </div>
            ) : (
              session.status === 'cancelled' ? (
                <div className="flex items-center justify-center">
                  <button
                    disabled={true}
                    className="flex-1 py-2 px-4 text-center rounded-md bg-gray-600 cursor-not-allowed text-gray-300"
                  >
                    Cancelled
                  </button>
                </div>
              ) : new Date(session.date) < new Date() ? (
                <div className="flex items-center justify-center">
                  <button
                    disabled={true}
                    className="flex-1 py-2 px-4 text-center rounded-md bg-gray-700 text-gray-400 cursor-not-allowed"
                  >
                    Completed
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (hasUserJoined(session)) {
                      confirmLeaveSession(session.id);
                    } else if ((session.players.length + 1) < session.maxPlayers && 
                              !(session.isPrivate && 
                                (getJoinRequestStatus(session.id) === 'pending' || 
                                getJoinRequestStatus(session.id) === 'rejected' ||
                                sessionJoinRequests[session.id]?.isExpired))) {
                      confirmJoinSession(session.id);
                    }
                  }}
                  disabled={((session.players.length + 1) >= session.maxPlayers && !hasUserJoined(session)) ||
                          (session.isPrivate && 
                            (getJoinRequestStatus(session.id) === 'pending' || 
                            getJoinRequestStatus(session.id) === 'rejected' ||
                            sessionJoinRequests[session.id]?.isExpired))}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    (session.players.length + 1) >= session.maxPlayers && !hasUserJoined(session)
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                    : session.isPrivate && sessionJoinRequests[session.id]?.isExpired
                    ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                    : session.isPrivate && getJoinRequestStatus(session.id) === 'pending'
                    ? 'bg-yellow-600 cursor-not-allowed text-white'
                    : session.isPrivate && getJoinRequestStatus(session.id) === 'rejected'
                    ? 'bg-red-600 cursor-not-allowed text-white'
                    : hasUserJoined(session)
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {(session.players.length + 1) >= session.maxPlayers && !hasUserJoined(session)
                    ? 'Session Full'
                    : hasUserJoined(session)
                    ? 'Leave Session'
                    : session.isPrivate && sessionJoinRequests[session.id]?.isExpired
                    ? 'Session Expired'
                    : session.isPrivate && getJoinRequestStatus(session.id) === 'pending'
                    ? 'Pending Approval'
                    : session.isPrivate && getJoinRequestStatus(session.id) === 'rejected'
                    ? 'Request Rejected'
                    : session.isPrivate ? 'Request to Join' : 'Join Session'}
                </button>
              )
            )}
            
            <Link
              href={`/sessions/${session.id}`}
              className="text-center block w-full py-2 px-4 rounded-md border border-indigo-500 text-indigo-400 hover:bg-indigo-900 hover:text-indigo-300 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-pulse flex justify-center my-8">
              <div className="h-8 w-8 bg-indigo-500 rounded-full"></div>
            </div>
            <p>Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="player-card-portal" className="fixed inset-0 pointer-events-none z-[9999]" />
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {locationName ? `Sessions at ${locationName}` : 'Available Sessions'}
            </h1>
          <Link
            href="/sessions/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Session
          </Link>
        </div>

        {error && (
            <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : getFilteredSessionsByStatus().length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-400 text-lg">
                No active sessions available.
              </p>
          </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {getFilteredSessionsByStatus().map((session) => renderSessionCard(session))}
                  </div>
                      )}
                    </div>
                  </div>

      {/* Join Request Modal */}
      {showJoinRequestModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Request to Join Private Session</h3>
            
            <p className="text-gray-300 mb-4">
              {filteredSessions.find(s => s.id === selectedSessionId)?.isPrivate 
                ? 'This is a private session. Your request will be reviewed by the host before you can join.'
                : 'You are about to join this session.'}
            </p>
            
            <div className="mb-4">
              <label htmlFor="joinMessage" className="block text-sm font-medium text-gray-300 mb-2">
                Message to the Host (Optional)
              </label>
              <textarea
                id="joinMessage"
                rows={3}
                value={joinRequestMessage}
                onChange={(e) => setJoinRequestMessage(e.target.value)}
                placeholder="Introduce yourself or include any relevant information for the host..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
                      </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowJoinRequestModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitJoinRequest}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Send Request
              </button>
                        </div>
                    </div>
                  </div>
      )}
      
      {/* Confirmation dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Action</h3>
            
            <p className="text-gray-300 mb-4">
              {confirmDialog.title}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmDialog}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
                      <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {confirmDialog.confirmText}
                      </button>
                  </div>
                </div>
          </div>
        )}
    </>
  );
}