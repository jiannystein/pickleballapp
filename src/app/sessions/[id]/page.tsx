'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatTime, formatDateTime, isSessionEnded } from '@/lib/dateUtils';
import { useSession } from 'next-auth/react';
import NotificationBadge from '@/components/NotificationBadge';
import RatePlayersModal from '@/components/RatePlayersModal';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaDollarSign, FaCamera, FaTrash } from 'react-icons/fa';
import UserAvatar from '@/components/UserAvatar';
import { PiConfettiFill } from 'react-icons/pi';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// Define the Player type as the same as User to fix the linter error
type Player = User;

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  photoUrl?: string;
}

interface Session {
  id: string;
  title: string;
  description?: string;
  location: Location;
  date: string;
  duration: number;
  maxPlayers: number;
  creator: User;
  players: User[];
  lookingForPlayers?: boolean;
  lookingForTeams?: boolean;
  price?: string;
  paymentMethod?: string;
  contactInfo?: string;
  isPrivate?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
}

interface JoinRequest {
  id: string;
  userId: string;
  sessionId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function SessionDetail() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isRatePlayersModalOpen, setIsRatePlayersModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [userJoinRequest, setUserJoinRequest] = useState<{
    id: string;
    status: string;
  } | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [sessionPhotos, setSessionPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id: string;
    photoUrl: string;
    caption?: string;
    uploadedBy?: {
      id: string;
      name: string;
      avatarUrl?: string;
    }
  } | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRatedAnyPlayers, setHasRatedAnyPlayers] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<{
    pendingReviewsCount: number;
    pendingReviewPlayers: any[];
    allReviewsComplete: boolean;
  } | null>(null);
  
  // Add a ref for the rate players section
  const ratePlayersRef = useRef<HTMLDivElement>(null);
  
  // Define memoized fetch functions first to avoid reference issues
  const fetchSession = useCallback(async () => {
    try {
      const sessionId = params?.id;
      
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      // Convert to string if it's an array
      const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;
      
      setIsLoading(true);
      // Use cache option to leverage browser cache
      const res = await fetch(`/api/sessions/${id}`, {
        cache: 'default' // Use cache but validate with server
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error('Failed to fetch session details');
      }
      
      const data = await res.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [params?.id]);
  
  const fetchPendingReviews = useCallback(async () => {
    if (!session?.id || !currentUserId) return;
    
    try {
      const res = await fetch(`/api/sessions/${session.id}/reviews?userId=${currentUserId}&pending=true`);
      
      if (!res.ok) {
        console.error('Failed to fetch pending reviews:', res.status);
        return;
      }
      
      const data = await res.json();
      setPendingReviews(data);
      
      // Also check if the user has rated any players
      const hasRated = data.allReviewsComplete || 
                       (data.pendingReviewsCount < session.players.length);
      
      setHasRatedAnyPlayers(hasRated);
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
    }
  }, [session?.id, currentUserId, session?.players?.length]);

  const fetchJoinRequests = useCallback(async () => {
    if (!session?.id) return;
    
    try {
      setLoadingRequests(true);
      const res = await fetch(`/api/sessions/${session.id}/requests`);
      
      if (!res.ok) {
        console.error('Failed to fetch join requests:', res.status);
        return;
      }
      
      const data = await res.json();
      setJoinRequests(data);
    } catch (err) {
      console.error('Error fetching join requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, [session?.id]);

  const fetchUserJoinRequest = useCallback(async () => {
    if (!session?.id || !currentUserId) return;
    
    try {
      const res = await fetch(`/api/sessions/${session.id}/requests/user`);
      
      if (!res.ok) {
        console.error('Failed to fetch user join request:', res.status);
        return;
      }
      
      const data = await res.json();
      if (data) {
        setUserJoinRequest({
          id: data.id,
          status: data.status
        });
      }
    } catch (err) {
      console.error('Error fetching user join request:', err);
    }
  }, [session?.id, currentUserId]);

  const fetchSessionPhotos = useCallback(async () => {
    if (!session?.id) return;
    
    try {
      const res = await fetch(`/api/sessions/${session.id}/photos`);
      
      if (!res.ok) {
        console.error('Failed to fetch session photos:', res.status);
        return;
      }
      
      const data = await res.json();
      setSessionPhotos(data);
    } catch (err) {
      console.error('Error fetching session photos:', err);
    }
  }, [session?.id]);

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

  useEffect(() => {
    fetchCurrentUser();
    fetchSession();
  }, [fetchSession]);

  // Add useEffect for checking location hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if URL has #rate-players
      if (window.location.hash === '#rate-players') {
        // Check if there are pending reviews
        if (pendingReviews?.allReviewsComplete || pendingReviews?.pendingReviewsCount === 0) {
          // If no pending reviews, replace the URL without the hash
          window.history.replaceState(null, '', window.location.pathname);
          // Still show a quick message to user
          setIsRatePlayersModalOpen(true);
          setTimeout(() => {
            setIsRatePlayersModalOpen(false);
          }, 2000); // Close after 2 seconds
        } else if (ratePlayersRef.current) {
          // If there are pending reviews, scroll to the section and open the modal
          ratePlayersRef.current.scrollIntoView({ behavior: 'smooth' });
          // Open the rate players modal
          setTimeout(() => {
            openRatePlayersModal();
          }, 500);
        }
      }
      // If there are pending reviews and the session is complete, automatically show rating UI
      else if (session?.status === 'completed' && pendingReviews && 
              pendingReviews.pendingReviewsCount > 0 && 
              !isRatePlayersModalOpen) {
        // Check if this is the first time viewing (using a session storage flag)
        const hasSeenRatingPrompt = sessionStorage.getItem(`seen-rating-prompt-${session.id}`);
        if (!hasSeenRatingPrompt) {
          // Set the flag so we don't keep showing the prompt on every visit
          sessionStorage.setItem(`seen-rating-prompt-${session.id}`, 'true');
          // Scroll to the rate players section
          if (ratePlayersRef.current) {
            ratePlayersRef.current.scrollIntoView({ behavior: 'smooth' });
            // Open the rate players modal after a short delay
            setTimeout(() => {
              openRatePlayersModal();
            }, 1000);
          }
        }
      }
    }
  }, [session, pendingReviews, isRatePlayersModalOpen]);

  // Add useEffect to fetch pending reviews when session is loaded
  useEffect(() => {
    if (session && session.status === 'completed' && currentUserId) {
      console.log('Session completed, fetching pending reviews');
      fetchPendingReviews();
    }
  }, [session, currentUserId, fetchPendingReviews]);

  useEffect(() => {
    if (session && currentUserId) {
      if (session.creator.id === currentUserId) {
        fetchJoinRequests();
        
        // Set up an interval to periodically check for pending requests for hosts
        const intervalId = setInterval(() => {
          console.log('Periodic check for pending requests');
          fetchJoinRequests();
        }, 15000); // Check every 15 seconds
        
        return () => clearInterval(intervalId);
      } else if (session.isPrivate) {
        fetchUserJoinRequest();
      }
    }
  }, [session, currentUserId, fetchJoinRequests, fetchUserJoinRequest]);

  useEffect(() => {
    if (session) {
      fetchSessionPhotos();
    }
  }, [session, fetchSessionPhotos]);

  useEffect(() => {
    // Filter pending requests
    if (joinRequests && joinRequests.length > 0) {
      setPendingRequests(joinRequests.filter(req => req.status === 'pending'));
    }
  }, [joinRequests]);

  // Function to mark a session as completed
  async function markSessionAsCompleted() {
    try {
      if (!session) return;
      
      console.log('Manually marking session as completed:', session.id);
      
      const res = await fetch(`/api/sessions/${session.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update session status');
      }
      
      // Update local session state
      setSession({
        ...session,
        status: 'completed'
      });
      
      // Show success message
      setSuccessMessage('Session marked as completed');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh session data to get latest status
      fetchSession();
    } catch (err) {
      console.error('Error marking session as completed:', err);
      setErrorMessage('Error updating session status');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }

  // Check if session is past start time
  const isPastSessionStart = useCallback((session: Session | null) => {
    if (!session) return false;
    return new Date(session.date) < new Date();
  }, []);

  // Add this effect to automatically mark past sessions as completed
  useEffect(() => {
    const checkSessionStatus = async () => {
      if (session && !isLoading) {
        // Check if the session has ended (not just started)
        const isEnded = isSessionEnded(session);
        
        if (isEnded && session.status !== 'cancelled' && session.status !== 'completed') {
          console.log('Marking ended session as completed:', session.id);
          await markSessionAsCompleted();
        }
      }
    };
    
    checkSessionStatus();
  }, [session, isLoading, markSessionAsCompleted]);

  async function handleJoinSession() {
    if (!session) return;
    
    if (session.isPrivate) {
      setShowRequestModal(true);
      return;
    }
    
    try {
      const res = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      // Refresh session data
      fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleSubmitJoinRequest() {
    if (!session) return;

    try {
      const res = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: joinMessage }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit join request');
      }

      // Set status to show to the user
      setJoinRequestStatus({
        status: 'success',
        message: data.message || 'Your request to join has been sent to the host.',
      });
      
      // Close the modal after success
      setShowRequestModal(false);
      setJoinMessage('');
    } catch (err) {
      setJoinRequestStatus({
        status: 'error',
        message: err instanceof Error ? err.message : 'An error occurred',
      });
    }
  }

  async function handleLeaveSession() {
    if (!session) return;
    
    try {
      const res = await fetch(`/api/sessions/${session.id}/leave`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to leave session');
      }

      // Refresh session data
      fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleJoinRequestAction(requestId: string, status: 'approved' | 'rejected') {
    if (!session) return;
    
    try {
      const res = await fetch(`/api/sessions/${session.id}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${status} join request`);
      }

      // Refresh join requests and session data
      fetchJoinRequests();
      fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  // Check if the current user has joined this session
  function hasUserJoined(): boolean {
    if (!session || !currentUserId) return false;
    
    // Check if the user is the creator
    const isCreator = session.creator.id === currentUserId;
    
    // Check if the user is in the players list
    const isPlayer = session.players.some(player => player.id === currentUserId);
    
    console.log('User participation check:', {
      currentUserId,
      creatorId: session.creator.id,
      isCreator,
      isPlayer,
      playerIds: session.players.map(p => p.id)
    });
    
    return isCreator || isPlayer;
  }

  // Check if the current user is a player in this session
  function isPlayerInSession(): boolean {
    if (!session || !currentUserId) return false;
    
    // Check if user is in players array (participant)
    const isPlayer = session.players.some(player => player.id === currentUserId);
    
    // Also consider the creator as a player
    const isCreator = session.creator.id === currentUserId;
    
    return isPlayer || isCreator;
  }

  function isCreatedByUser(): boolean {
    if (!session || !currentUserId) return false;
    return session.creator.id === currentUserId;
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
    }
  }

  function getUserJoinRequestStatus(): 'pending' | 'approved' | 'rejected' | null {
    if (!userJoinRequest) return null;
    return userJoinRequest.status as 'pending' | 'approved' | 'rejected';
  }

  async function handleCancelJoinRequest() {
    if (!session) return;
    
    try {
      console.log('Canceling join request for session:', session.id);
      const res = await fetch(`/api/sessions/${session.id}/requests/user`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const data = await res.json();

      if (!res.ok) {
        console.error('Error response from server:', res.status, data);
        throw new Error(data.error || `Failed to cancel join request: ${res.status} ${res.statusText}`);
      }

      // Show success message
      setJoinRequestStatus({
        status: 'success',
        message: 'Your join request has been canceled successfully.'
      });
      
      // Reset the user join request state
      setUserJoinRequest(null);
      setShowCancelConfirmation(false);
      
      // Fetch session to refresh UI
      fetchSession();
      
    } catch (err) {
      console.error('Error canceling join request:', err);
      setJoinRequestStatus({
        status: 'error',
        message: err instanceof Error ? err.message : 'An error occurred while canceling your request. Please try again.'
      });
      setShowCancelConfirmation(false);
    }
  }

  // Format date to a more readable format
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // Function to open the rate players modal
  const openRatePlayersModal = () => {
    setIsRatePlayersModalOpen(true);
  };

  // Function to handle opening the photo modal
  const openPhotoModal = (photo: { id: string; photoUrl: string; caption?: string; uploadedBy?: any }) => {
    setSelectedPhoto(photo);
    setIsPhotoModalOpen(true);
  };

  // Function to close the photo modal
  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
  };

  // Add keyboard event listener for the photo modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePhotoModal();
      }
    };

    if (isPhotoModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPhotoModalOpen]);

  // Photo modal component
  const PhotoModal = () => {
    if (!selectedPhoto) return null;
    
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if the backdrop itself was clicked, not its children
      if (e.target === e.currentTarget) {
        closePhotoModal();
      }
    };
    
    // Check if current user is the owner of the photo
    const isOwner = selectedPhoto.uploadedBy && selectedPhoto.uploadedBy.id === currentUserId;
    
    return (
      <div 
        className={`fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-2 sm:p-4 ${isPhotoModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}
        onClick={handleBackdropClick}
      >
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Close button */}
          <button 
            onClick={closePhotoModal}
            className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          {/* Delete button - only visible for photos uploaded by the current user */}
          {isOwner && (
            <button 
              onClick={(e) => handleDeletePhoto(selectedPhoto.id, e)}
              className={`absolute top-2 left-2 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors ${
                deletePhotoId === selectedPhoto.id ? 'opacity-70 pointer-events-none' : ''
              }`}
              aria-label="Delete photo"
              disabled={isDeletingPhoto}
            >
              {deletePhotoId === selectedPhoto.id ? (
                <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              )}
            </button>
          )}
          
          {/* Photo container */}
          <div className="bg-black relative w-full h-auto max-h-[80vh] overflow-hidden rounded-lg">
            <img
              src={selectedPhoto.photoUrl}
              alt={selectedPhoto.caption || "Session photo"}
              className="object-contain w-full h-full max-h-[80vh] mx-auto"
            />
          </div>
          
          {/* Caption */}
          {selectedPhoto.caption && (
            <div className="bg-gray-800 p-3 sm:p-4 mt-2 sm:mt-3 rounded-lg">
              <p className="text-white text-sm sm:text-base">{selectedPhoto.caption}</p>
              {selectedPhoto.uploadedBy && (
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Uploaded by {selectedPhoto.uploadedBy.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Function to handle deleting a photo
  const handleDeletePhoto = async (photoId: string, e?: React.MouseEvent) => {
    // Stop propagation if event exists (prevent modal from opening when clicking delete button)
    if (e) {
      e.stopPropagation();
    }
    
    if (!session || isDeletingPhoto) return;
    
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }
    
    setIsDeletingPhoto(true);
    setDeletePhotoId(photoId);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`/api/sessions/${session.id}/photos/${photoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      // Update the session photos state
      setSessionPhotos(prev => prev.filter(photo => photo.id !== photoId));
      
      // If the deleted photo is currently selected, close the modal
      if (selectedPhoto && selectedPhoto.id === photoId) {
        closePhotoModal();
      }
      
      // Display success message
      setSuccessMessage('Photo deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds
    } catch (error) {
      console.error('Error deleting photo:', error);
      // Display error message
      setErrorMessage('Failed to delete photo');
      setTimeout(() => setErrorMessage(null), 3000); // Clear after 3 seconds
    } finally {
      setIsDeletingPhoto(false);
      setDeletePhotoId(null);
    }
  };

  // Function to show confirmation for leave session
  const showLeaveSessionConfirmation = () => {
    if (confirm("Are you sure you want to leave this session?")) {
      handleLeaveSession();
    }
  };

  // Function to check and update session status if needed
  const checkAndUpdateSessionStatus = useCallback(async () => {
    if (!session) return;
    
    // Check if the session has ended (based on end time)
    const isEnded = isSessionEnded(session);
    
    // If session has ended and not marked as completed or cancelled, update it
    if (isEnded && session.status !== 'completed' && session.status !== 'cancelled') {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/sessions/update-status`, {
          method: 'POST',
        });
        
        if (response.ok) {
          // Refresh the session data
          fetchSession();
          setSuccessMessage('Session status updated to completed');
        }
      } catch (error) {
        console.error('Error updating session status:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [session, fetchSession, isSessionEnded]);
  
  // Check session status on component mount
  useEffect(() => {
    checkAndUpdateSessionStatus();
  }, [checkAndUpdateSessionStatus]);

  // Function to render feedback banners for various states
  const renderFeedbackBanner = () => {
    if (!session) return null;
    
    const banners = [];
    
    // Check if session is completed and user hasn't rated all players yet
    if (session.status === 'completed' && hasUserJoined() && pendingReviews && pendingReviews.pendingReviewsCount > 0) {
      banners.push(
        <div key="rate-reminder" className="bg-yellow-800/30 border border-yellow-700 rounded-lg p-4 mb-6">
          <h3 className="text-yellow-300 font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor"/>
            </svg>
            Don't forget to rate the players!
          </h3>
          <p className="text-gray-300 mt-1 text-sm">
            Rating other players helps build a better community and provides valuable feedback.
          </p>
        </div>
      );
    }
    
    // Add custom banners for other states as needed
    
    return banners.length > 0 ? <>{banners}</> : null;
  };

  // Function to render session status badge with more context
  const renderStatusBadge = () => {
    if (!session) return null;
    
    let badgeClasses = '';
    let badgeText = '';
    let icon = null;
    
    if (session.status === 'cancelled') {
      badgeClasses = 'bg-red-900/60 text-red-200';
      badgeText = 'Cancelled';
      icon = (
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    } else if (session.status === 'completed' || new Date(session.date) < new Date()) {
      badgeClasses = 'bg-yellow-900/60 text-yellow-200';
      badgeText = 'Completed';
      icon = (
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } else {
      badgeClasses = 'bg-green-900/60 text-green-200';
      badgeText = 'Active';
      icon = (
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeClasses}`}>
        {icon}
        {badgeText}
      </div>
    );
  };

  // Function to check if user has rated any players
  const checkUserRatings = useCallback(async () => {
    if (!session || !currentUserId) return;
    
    try {
      const response = await fetch(`/api/sessions/${session.id}/reviews`);
      
      if (response.ok) {
        const reviews = await response.json();
        
        // Check if the current user has submitted any reviews for this session
        const userHasRated = reviews.some((review: any) => review.reviewerId === currentUserId);
        
        setHasRatedAnyPlayers(userHasRated);
      }
    } catch (error) {
      console.error('Error checking user ratings:', error);
    }
  }, [session, currentUserId]);
  
  // Check for user ratings when session or user ID changes
  useEffect(() => {
    checkUserRatings();
  }, [checkUserRatings]);

  // Inside SessionDetail component, add this near line 1477, just after renderSessionInfo()
  // Function to get the pending review IDs for display
  const pendingReviewIds = useMemo(() => {
    // Create a Set of user IDs that still need to be rated
    return new Set(pendingReviews?.pendingReviewPlayers?.map(player => player.id) || []);
  }, [pendingReviews]);

  // Replace references to isPastSession with isSessionEnded
  const isPastSession = isSessionEnded(session);

  // Format date and time for display
  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  }, []);

  // Get session date/time information
  const { date, time } = formatDateTime(session?.date || '');
  
  // Use the enhanced isSessionEnded logic instead of simple date comparison
  // const isPastSession = sessionDate < new Date();

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <div className="relative">
              <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-t-4 border-indigo-300 opacity-30 rounded-full animate-ping absolute inset-0"></div>
            </div>
            <h2 className="text-xl font-medium text-white">Loading session details...</h2>
            <p className="text-gray-400">Please wait while we fetch the latest information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-900 border border-red-700 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
          <div className="text-center mt-6">
            <Link 
              href="/my-sessions?tab=completed" 
              className="text-indigo-400 hover:text-indigo-300"
            >
              Back to My Sessions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center text-white">Session not found</div>
          <div className="text-center mt-6">
            <Link 
              href="/my-sessions?tab=completed" 
              className="text-indigo-400 hover:text-indigo-300"
            >
              Back to My Sessions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function renderJoinRequestsSection() {
    if (!session || !isCreatedByUser() || joinRequests.length === 0) {
      return null;
    }

    const pendingRequests = joinRequests.filter(req => req.status === 'pending');
    
    if (pendingRequests.length === 0) {
  return (
        <div className="bg-gray-800 rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Join Requests
          </h2>
          <p className="text-gray-400">No pending join requests.</p>
                  </div>
      );
    }

    return (
      <div className="bg-gray-800 rounded-lg shadow p-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
            Pending Join Requests ({pendingRequests.length})
          </h2>
                  </div>
        <div className="space-y-4">
          {pendingRequests.map(request => (
            <div key={request.id} className="bg-gray-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {request.user.avatarUrl ? (
                    <Image 
                      src={request.user.avatarUrl} 
                      alt={request.user.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm text-white">{request.user.name.charAt(0)}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">{request.user.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                  </p>
                  {request.message && (
                    <p className="text-sm text-gray-300 mt-2 italic">"{request.message}"</p>
                    )}
                  </div>
                </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleJoinRequestAction(request.id, 'rejected')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleJoinRequestAction(request.id, 'approved')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderJoinRequestModal() {
    if (!showRequestModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Request to Join Private Session</h3>
          
          <p className="text-gray-300 mb-4">
            This is a private session hosted by <strong>{session?.creator.name || 'the host'}</strong>. Your request will be reviewed by the host before you can join.
          </p>
          
          <div className="bg-gray-700 p-4 rounded-md mb-4">
            <div className="flex items-center text-yellow-300 mb-2">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
              <span className="font-medium">Private Session Information</span>
                  </div>
            <p className="text-gray-300 text-sm">
              Private sessions require host approval before you can join. The host will review your request and you'll be notified when it's approved or declined.
            </p>
                  </div>
          
          <div className="mb-4">
            <label htmlFor="joinMessage" className="block text-sm font-medium text-gray-300 mb-2">
              Message to the Host (Optional)
            </label>
            <textarea
              id="joinMessage"
              rows={3}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Introduce yourself or include any relevant information for the host..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
                    </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowRequestModal(false)}
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
    );
  }

  // Find and replace the renderRatePlayersButton function
  const renderRatePlayersButton = () => {
    if (!session) return null;
     
    // Only show rate players button if user has joined and session is completed
    const userHasJoined = 
      (currentUserId && session.creator?.id === currentUserId) || 
      (currentUserId && session.players?.some(player => player.id === currentUserId));
     
    if (!userHasJoined || session.status !== 'completed') return null;
    
    // Add a ref to the rate players section
    const pendingCount = pendingReviews?.pendingReviewsCount || 0;
    const allPlayersRated = pendingReviews?.allReviewsComplete || false;
    
    return (
      <div id="rate-players-section" ref={ratePlayersRef} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 p-6 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Player Ratings
        </h3>
        
        {allPlayersRated ? (
          <div className="bg-green-900/30 border border-green-700 text-white px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p>
              <span className="font-semibold">Congratulations!</span> You've rated all players from this session.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-900/30 border border-yellow-700 text-white px-4 py-3 rounded-lg">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>
                <span className="font-semibold">Don't forget to rate the players!</span>{' '}
                You have {pendingCount} {pendingCount === 1 ? 'player' : 'players'} to rate from this session.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsRatePlayersModalOpen(true)}
                className="relative bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 group"
              >
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white animate-pulse">
                    {pendingCount}
                  </span>
                )}
                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="animate-pulse">Rate Players</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPlayersList = () => {
    if (!session) return null;
    
    // Check if the session is completed to show rate buttons
    const isCompleted = session.status === 'completed';
    
    // Fetch the list of players that still need to be rated (pending reviews)
    const pendingReviewIds = new Set(Array.from(pendingReviews?.pendingReviewPlayers || [])
      .map(player => player.id));
    
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Players ({session.players.length + 1}/{session.maxPlayers})</h3>
        
        <div className="space-y-4">
          {/* Host */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3">
                <UserAvatar 
                  name={session.creator.name} 
                  imageUrl={session.creator.avatarUrl}
                  userId={session.creator.id}
                  showPlayerCard={true}
                  size={40}
                  playerCardTrigger="hover"
                />
              </div>
              <div>
                <div className="text-white font-medium flex items-center">
                  {session.creator.name}
                  <span className="ml-2 text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded">Host</span>
                  {session.creator.id === currentUserId && (
                    <span className="ml-2 text-xs bg-green-900 text-green-200 px-2 py-0.5 rounded">You</span>
                  )}
                </div>
                </div>
              </div>
            {isCompleted && session.creator.id !== currentUserId && (
              <button
                onClick={() => {
                  setSelectedPlayer(session.creator);
                  setIsRatePlayersModalOpen(true);
                }}
                className={`text-xs px-3 py-1 rounded ${
                  pendingReviewIds.has(session.creator.id) 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                    : "bg-gray-600 text-gray-300"
                }`}
                disabled={!pendingReviewIds.has(session.creator.id)}
              >
                {pendingReviewIds.has(session.creator.id) ? "Rate" : "Rated"}
              </button>
            )}
            </div>

          {/* Players */}
          {session.players.map(player => (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3">
                  <UserAvatar 
                    name={player.name} 
                    imageUrl={player.avatarUrl}
                    userId={player.id}
                    showPlayerCard={true}
                    size={40}
                    playerCardTrigger="hover"
                  />
              </div>
                <div>
                  <div className="text-white font-medium flex items-center">
                    {player.name}
                    {player.id === currentUserId && (
                      <span className="ml-2 text-xs bg-green-900 text-green-200 px-2 py-0.5 rounded">You</span>
                    )}
                  </div>
                </div>
              </div>
              {isCompleted && player.id !== currentUserId && (
                <button
                  onClick={() => {
                    setSelectedPlayer(player);
                    setIsRatePlayersModalOpen(true);
                  }}
                  className={`text-xs px-3 py-1 rounded ${
                    pendingReviewIds.has(player.id) 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                      : "bg-gray-600 text-gray-300"
                  }`}
                  disabled={!pendingReviewIds.has(player.id)}
                >
                  {pendingReviewIds.has(player.id) ? "Rate" : "Rated"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Improve session details layout for mobile
  const renderSessionInfo = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
        <div className="bg-gray-800 rounded-lg p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">Session Details</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <FaCalendarAlt className="text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                <p className="text-white text-sm sm:text-base">{formatDate(session.date)}</p>
                  </div>
                  </div>
            <div className="flex items-start">
              <FaClock className="text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                    <div>
                <p className="text-white text-sm sm:text-base">{formatDuration(session.duration)}</p>
                    </div>
            </div>
            <div className="flex items-start">
              <FaMapMarkerAlt className="text-indigo-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-white text-sm sm:text-base">{session.location.name}</p>
                <p className="text-gray-400 text-xs sm:text-sm">{session.location.address}</p>
                {session.location.instructions && (
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">{session.location.instructions}</p>
                )}
              </div>
                </div>
              </div>
            </div>

        <div className="bg-gray-800 rounded-lg p-4 sm:p-5">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">Additional Info</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <FaUsers className="text-indigo-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="text-white text-sm sm:text-base">{session.players.length + 1} / {session.maxPlayers} players</p>
              </div>
            </div>
            {session.price && (
              <div className="flex items-start">
                <FaDollarSign className="text-indigo-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm sm:text-base">{session.price}</p>
                  {session.paymentMethod && (
                    <p className="text-gray-400 text-xs sm:text-sm">Payment: {session.paymentMethod}</p>
                  )}
                </div>
                    </div>
                  )}
            {session.contactInfo && (
              <div className="flex items-start">
                <svg className="w-4 h-4 text-indigo-400 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-white text-sm sm:text-base break-words">{session.contactInfo}</p>
                </div>
              </div>
                    )}
                  </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {errorMessage && (
          <div className="bg-red-900/30 border border-red-700 text-white px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
            {errorMessage}
                    </div>
        )}
        
        {successMessage && (
          <div className="bg-green-900/30 border border-green-700 text-white px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
                  </div>
                )}
        
        {renderFeedbackBanner()}
        
        {/* Breadcrumb navigation */}
        <div className="mb-4 sm:mb-6 flex text-sm text-gray-400">
          <Link href="/my-sessions?tab=completed" className="hover:text-blue-400 transition flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to My Sessions
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-200 truncate font-medium">{session.title}</span>
        </div>
        
        {/* Session Header */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-700">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{session.title}</h1>
              
              <div className="flex flex-wrap gap-2">
                {renderStatusBadge()}
                
                {session.isPrivate && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-900/60 text-purple-200 border border-purple-700">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Private
                  </span>
                )}
              </div>
            </div>
            
            {session.description && (
              <div className="mt-4 text-gray-300 text-sm sm:text-base bg-gray-800/50 p-4 rounded-lg border-l-4 border-indigo-500">
                {session.description}
                    </div>
                  )}
            
            {/* Host info */}
            <div className="mt-6 flex items-center bg-gray-800/40 p-4 rounded-lg">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shadow-md">
                {session.creator.avatarUrl ? (
                  <img 
                    src={session.creator.avatarUrl} 
                    alt={session.creator.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-lg sm:text-xl text-gray-300 font-semibold">
                    {session.creator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <p className="text-white text-base sm:text-lg font-medium">Hosted by {session.creator.name}</p>
                  <span className="ml-2 bg-indigo-600/40 text-indigo-200 text-xs px-2 py-0.5 rounded-full border border-indigo-500/50">Host</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">{session.creator.email}</p>
              </div>
            </div>

            {/* Session details and additional info */}
            {renderSessionInfo()}

            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {isCreatedByUser() ? (
                // Creator actions
                <>
                  {session.status !== 'cancelled' && !isPastSession && (
                    <Link 
                      href={`/sessions/${session.id}/edit`}
                      className="bg-indigo-600 text-white py-2.5 px-5 rounded-lg hover:bg-indigo-700 transition flex-1 text-center font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                      Edit Session
                    </Link>
                  )}
                  
                  {/* Add button to manually mark as completed for past sessions not yet completed */}
                  {isPastSession && session.status !== 'completed' && session.status !== 'cancelled' && (
                    <button
                      onClick={markSessionAsCompleted}
                      className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white py-2.5 px-5 rounded-lg transition flex items-center font-medium shadow-md"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Mark Session as Completed
                    </button>
                  )}
                </>
              ) : (
                // Participant actions
                <>
                  {session.status !== 'cancelled' && !isPastSession && (
                    hasUserJoined() ? (
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                        <button
                          onClick={() => showLeaveSessionConfirmation()}
                          className="bg-red-600 text-white py-2.5 px-5 rounded-lg hover:bg-red-700 transition flex-1 font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Leave Session
                        </button>
                        
                        <Link
                          href={`/sessions/${session.id}/photos`}
                          className="border border-indigo-500 text-indigo-400 py-2.5 px-5 rounded-lg hover:bg-indigo-900 hover:text-indigo-300 transition flex-1 text-center font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Upload
                        </Link>
              </div>
                    ) : userJoinRequest && userJoinRequest.status === 'pending' ? (
                      <div className="w-full space-y-3">
                        <button
                          disabled
                          className="w-full bg-yellow-600/60 text-white py-2.5 px-5 rounded-lg cursor-not-allowed flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Join Request Pending
                        </button>
                        <p className="text-center text-gray-400 text-sm">
                          Your request to join this session is pending approval from the host.
                        </p>
                        <div className="mt-2 text-center">
                          <button
                            onClick={() => setShowCancelConfirmation(true)}
                            className="text-red-400 hover:text-red-300 text-sm inline-flex items-center"
                          >
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Request
                          </button>
                        </div>
                      </div>
                    ) : session.players.length < session.maxPlayers ? (
                      <div className="w-full">
                        <button
                          onClick={handleJoinSession}
                          className="w-full bg-green-600 text-white py-2.5 px-5 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Join Session
                        </button>
                      </div>
                    ) : (
                      <div className="w-full">
                        <button
                          disabled
                          className="w-full bg-gray-700 text-white py-2.5 px-5 rounded-lg cursor-not-allowed font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Session Full
                        </button>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mt-8">
          {/* Players section */}
          <div className="space-y-8">
            {/* Player Ratings section */}
            {session.status === 'completed' && hasUserJoined() && renderRatePlayersButton()}
            
            {/* Players list section */}
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
          Players <span className="ml-2 text-sm text-gray-400">({session.players.length + 1}/{session.maxPlayers})</span>
              </h3>

        <div className="space-y-5">
          {/* Host */}
          <div className="flex items-center justify-between bg-gray-750/50 p-3 rounded-lg">
            <div className="flex items-center">
              <div className="mr-3">
                <UserAvatar 
                  name={session.creator.name} 
                  imageUrl={session.creator.avatarUrl}
                  userId={session.creator.id}
                  showPlayerCard={true}
                  size={42}
                  playerCardTrigger="hover"
                />
              </div>
              <div>
                <div className="text-white font-medium flex items-center">
                  {session.creator.name}
                  <span className="ml-2 text-xs bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-700/50">Host</span>
                  {session.creator.id === currentUserId && (
                    <span className="ml-2 text-xs bg-green-900/80 text-green-200 px-2 py-0.5 rounded-full border border-green-700/50">You</span>
                  )}
                </div>
              </div>
            </div>
            {session.status === 'completed' && session.creator.id !== currentUserId && (
              <button
                onClick={() => {
                  setSelectedPlayer(session.creator);
                  setIsRatePlayersModalOpen(true);
                }}
                className={`text-xs px-3 py-1.5 rounded-md ${
                  pendingReviewIds.has(session.creator.id) 
                    ? "bg-red-600 hover:bg-red-700 text-white font-medium" 
                    : "bg-gray-700 text-gray-300"
                } flex items-center transition-colors`}
                disabled={!pendingReviewIds.has(session.creator.id)}
              >
                {pendingReviewIds.has(session.creator.id) ? (
                  <>
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="animate-pulse">Rate</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Rated
                  </>
                )}
              </button>
            )}
                      </div>
          
          {/* Players */}
          {session.players.map(player => (
            <div key={player.id} className="flex items-center justify-between bg-gray-750/50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="mr-3">
                  <UserAvatar 
                    name={player.name} 
                    imageUrl={player.avatarUrl}
                    userId={player.id}
                    showPlayerCard={true}
                    size={42}
                    playerCardTrigger="hover"
                  />
                </div>
                <div>
                  <div className="text-white font-medium flex items-center">
                    {player.name}
                    {player.id === currentUserId && (
                      <span className="ml-2 text-xs bg-green-900/80 text-green-200 px-2 py-0.5 rounded-full border border-green-700/50">You</span>
                    )}
                  </div>
                </div>
              </div>
              {session.status === 'completed' && player.id !== currentUserId && (
                <button
                  onClick={() => {
                    setSelectedPlayer(player);
                    setIsRatePlayersModalOpen(true);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-md ${
                    pendingReviewIds.has(player.id) 
                      ? "bg-red-600 hover:bg-red-700 text-white font-medium" 
                      : "bg-gray-700 text-gray-300"
                  } flex items-center transition-colors`}
                  disabled={!pendingReviewIds.has(player.id)}
                >
                  {pendingReviewIds.has(player.id) ? (
                    <>
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="animate-pulse">Rate</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Rated
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
                  </div>
                </div>

    {/* Pending Join Requests - Only visible to host */}
    {isCreatedByUser() && pendingRequests.length > 0 && (
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Join Requests <span className="ml-2 text-sm bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-gray-750/50 rounded-lg p-4 border border-yellow-700/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {request.user.avatarUrl ? (
                        <img 
                          src={request.user.avatarUrl} 
                          alt={request.user.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-lg text-gray-300 font-semibold">
                          {request.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                      <p className="text-white font-medium">{request.user.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoinRequestAction(request.id, 'rejected')}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm flex items-center"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Decline
                    </button>
                    <button
                      onClick={() => handleJoinRequestAction(request.id, 'approved')}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    </div>
                    </div>
                
                {request.message && (
                  <div className="mt-3 bg-gray-800/70 p-3 rounded-md border-l-2 border-yellow-500">
                    <p className="text-sm text-gray-300 italic">"{request.message}"</p>
                  </div>
                )}
                  </div>
                ))}
              </div>
        </div>
      </div>
    )}
            </div>

  {/* Photos section - now as a full-width row */}
  <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
          Session Photos
        </h3>

        {session && session.status !== 'cancelled' && hasUserJoined() && (
                  <Link
            href={`/sessions/${session.id}/photos`}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center"
                  >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
            Upload Photos
                  </Link>
                )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 bg-gray-800/40 rounded-lg">
          <p className="text-gray-400">Loading photos...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40 bg-gray-800/40 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      ) : sessionPhotos.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-40 bg-gray-800/40 rounded-lg">
          <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
          <p className="text-gray-400 text-sm">No photos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sessionPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800/40 cursor-pointer"
              onClick={() => openPhotoModal(photo)}
            >
              <Image
                src={photo.photoUrl}
                alt="Session photo"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
              
              {photo.uploadedBy && photo.uploadedBy.id === currentUserId && (
                  <button
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id, e);
                  }}
                  disabled={isDeletingPhoto}
                  aria-label="Delete photo"
                >
                  <FaTrash size={14} />
                  </button>
                )}
            </div>
          ))}
          
          {sessionPhotos.length > 12 && (
            <Link
              href={`/sessions/${session.id}/photos`}
              className="flex items-center justify-center bg-gray-750/50 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-indigo-400 font-medium">View All Photos</span>
            </Link>
          )}
        </div>
      )}
    </div>
  </div>
</div>
        
        {/* Status update section - Make more prominent for any past, non-completed sessions */}
        {isPastSession && session.status !== 'completed' && session.status !== 'cancelled' && (
          <div className="my-8 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/50 p-6 rounded-xl shadow-lg">
            <div className="flex flex-col">
              <div className="flex items-center mb-3">
                <svg className="w-7 h-7 text-yellow-500 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h3 className="text-lg font-medium text-yellow-300">Action Required: Update Session Status</h3>
              </div>
              <p className="text-gray-300 mb-5 pl-9">
                <strong>Important:</strong> This session has ended but is not marked as completed. 
                Player ratings can only be submitted for completed sessions. Please update the status
                to enable rating functionality.
              </p>
              <div className="flex justify-end">
                  <button
                  onClick={markSessionAsCompleted}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 px-5 rounded-lg transition flex items-center font-medium"
                  >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  Mark Session as Completed
                  </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Display the Photo Modal */}
        <PhotoModal />
        
        {/* Rate Players Modal */}
        {session && (
          <RatePlayersModal
            session={{
              id: session.id,
              title: session.title,
              status: session.status,
              date: session.date,
              creator: session.creator,
              players: session.players
            }}
            isOpen={isRatePlayersModalOpen}
            onClose={() => setIsRatePlayersModalOpen(false)}
            onSuccess={() => {
              console.log('Successfully rated player, refreshing pending reviews');
              // After rating a player, refetch the pending reviews
              fetchPendingReviews();
            }}
          />
        )}
      </div>
    </div>
  );
}
