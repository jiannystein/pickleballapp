"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import usePendingReviews from '@/lib/usePendingReviews';
import { useRouter } from 'next/navigation';

// Debug flag to control logging
const DEBUG = process.env.NODE_ENV === 'development' && false; // Set to true only when debugging

// Re-implementing the StarRating component here for simplicity
function StarRating({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="w-6 h-6 focus:outline-none"
          onMouseOver={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} stars`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-full h-full ${
              (hoverRating || value) >= star
                ? "text-yellow-400"
                : "text-gray-400"
            }`}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Session {
  id: string;
  creator: Player;
  players: Player[];
  status: string;
  date: string;
  title: string;
}

interface RatePlayersModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RatePlayersModal({ session, isOpen, onClose, onSuccess }: RatePlayersModalProps) {
  const { data: authSession } = useSession();
  const router = useRouter(); // Add router for navigation
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [reviewedPlayers, setReviewedPlayers] = useState<Set<string>>(new Set());
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true); // Add loading state for players
  
  // Rating states
  const [skillLevel, setSkillLevel] = useState(0);
  const [sportsmanship, setSportsmanship] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [fairPlay, setFairPlay] = useState(0);
  const [comment, setComment] = useState("");

  // Calculate overall rating
  const calculateOverallRating = useCallback(() => {
    const ratings = [skillLevel, sportsmanship, communication, punctuality, fairPlay];
    const validRatings = ratings.filter(rating => rating > 0);
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((total, rating) => total + rating, 0);
    return (sum / validRatings.length).toFixed(1);
  }, [skillLevel, sportsmanship, communication, punctuality, fairPlay]);

  // Handle rating change
  const handleRatingChange = useCallback((field: string, value: number) => {
    switch (field) {
      case "skillLevel":
        setSkillLevel(value);
        break;
      case "sportsmanship":
        setSportsmanship(value);
        break;
      case "communication":
        setCommunication(value);
        break;
      case "punctuality":
        setPunctuality(value);
        break;
      case "fairPlay":
        setFairPlay(value);
        break;
      default:
        break;
    }
  }, []);

  // Reset form fields
  const resetForm = useCallback(() => {
    setSkillLevel(0);
    setSportsmanship(0);
    setCommunication(0);
    setPunctuality(0);
    setFairPlay(0);
    setComment("");
    setSelectedPlayer(null);
    setError(null);
    setSuccess(null);
  }, []);

  // Get players who can be rated by the current user
  const getPlayersToRate = useCallback(() => {
    if (!currentUserId) {
      if (DEBUG) console.log('No current user ID, returning empty array');
      return [];
    }
    
    if (DEBUG) {
      console.log('Current user ID:', currentUserId);
      console.log('Session creator ID:', session.creator.id);
    }
    
    // Start with an empty array
    const playersToRate: Player[] = [];
    
    // If the current user is the creator, they can rate all players except themselves
    if (session.creator.id === currentUserId) {
      const filteredPlayers = session.players.filter(player => player.id !== currentUserId);
      playersToRate.push(...filteredPlayers);
    } 
    // If the current user is a player, they can rate the creator (if not themselves) and other players
    else if (session.players.some(player => player.id === currentUserId)) {
      // Add creator if not the current user
      if (session.creator.id !== currentUserId) {
        playersToRate.push(session.creator);
      }
      // Add all other players except the current user
      const otherPlayers = session.players.filter(player => player.id !== currentUserId);
      playersToRate.push(...otherPlayers);
    }
    
    // Filter out already reviewed players
    return playersToRate.filter(player => !reviewedPlayers.has(player.id));
  }, [currentUserId, session, reviewedPlayers]);

  // Calculate pending review players using memoization
  const pendingReviewPlayers = useMemo(() => {
    return getPlayersToRate();
  }, [getPlayersToRate]);

  // Replace the refreshGlobalPendingReviewsCount function with our hook
  const { notifyPendingReviewsUpdate } = usePendingReviews();

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayer) {
      setError("Please select a player to rate");
      return;
    }
    
    if (!currentUserId) {
      setError("You must be logged in to submit a review");
      return;
    }
    
    if (skillLevel === 0 || sportsmanship === 0 || communication === 0 || 
        punctuality === 0 || fairPlay === 0) {
      setError("Please provide ratings for all categories");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const reviewData = {
        revieweeId: selectedPlayer.id,
        skillLevel,
        sportsmanship,
        communication,
        punctuality,
        fairPlay,
        comment: comment.trim() || undefined,
      };
      
      if (DEBUG) {
        console.log('Submitting review with data:', reviewData);
        console.log('Session ID:', session.id);
      }
      
      const response = await fetch(`/api/sessions/${session.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to submit review: ${response.status}`;
        try {
          const data = await response.json();
          errorMessage = data?.error || errorMessage;
        } catch (e) {
          // Ignore JSON parsing errors
        }
        throw new Error(errorMessage);
      }
      
      // Update reviewed players set
      setReviewedPlayers(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(selectedPlayer.id);
        return newSet;
      });
      
      // Show success message
      setSuccess(`Successfully rated ${selectedPlayer.name}!`);
      
      // Call the notifyPendingReviewsUpdate from our hook
      await notifyPendingReviewsUpdate();
      
      // Reset form for another review
      resetForm();
      
      // Alert parent component of success
      if (onSuccess) {
        onSuccess();
      }
      
      const remainingPlayers = pendingReviewPlayers.filter(player => player.id !== selectedPlayer.id);
      
      // If no more players to rate, close the modal and navigate to My Sessions > Completed
      if (remainingPlayers.length === 0) {
        // Close modal after a short delay so user can see success message
        setTimeout(() => {
          onClose();
          // Navigate to My Sessions > Completed tab
          router.push('/my-sessions?tab=completed');
        }, 1500);
      } else {
        // Set the next player to rate
        setSelectedPlayer(remainingPlayers[0]);
      }
    } catch (error: any) {
      setError(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch data about the current user
  useEffect(() => {
    // Only run this effect when modal is opened
    if (!isOpen) return;
    
    const getUserId = async () => {
      // First, try to get the ID from the auth session
    if (authSession?.user?.id) {
      setCurrentUserId(authSession.user.id);
        return;
      }
      
      // Otherwise, fetch from API
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.userId);
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      };
    
    getUserId();
    
    // Fetch already reviewed players for this session
    if (session?.id) {
      const fetchReviews = async () => {
        setIsLoadingPlayers(true);
        try {
          const response = await fetch(`/api/sessions/${session.id}/reviews`, {
            credentials: 'include', // Include cookies
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            const reviews = await response.json();
            
            // Use the currentUserId directly or from state if available
            const userId = authSession?.user?.id || currentUserId;
            
            const userReviews = reviews.filter(
              (review: any) => review.reviewerId === userId
            );
            
            const reviewedPlayerIds = userReviews.map((review: any) => review.revieweeId);
            
            setReviewedPlayers(
              new Set(reviewedPlayerIds)
            );
          }
        } catch (error) {
          console.error("Error fetching reviews:", error);
        } finally {
          setIsLoadingPlayers(false);
        }
      };
      
      fetchReviews();
    }
  }, [authSession, isOpen, session?.id, currentUserId]);

  // Set the selected player to the first pending review player when the modal opens
  useEffect(() => {
    if (isOpen && !isLoadingPlayers && pendingReviewPlayers.length > 0 && !selectedPlayer) {
      setSelectedPlayer(pendingReviewPlayers[0]);
    }
  }, [isOpen, pendingReviewPlayers, selectedPlayer, isLoadingPlayers]);

  // Function to check if all rating categories have been filled out
  const allCategoriesRated = () => {
    return skillLevel > 0 && 
           sportsmanship > 0 && 
           communication > 0 && 
           punctuality > 0 && 
           fairPlay > 0;
  };

  // Add effect to auto-close when no players to rate
  useEffect(() => {
    if (isOpen && !isLoadingPlayers && pendingReviewPlayers.length === 0) {
      // Auto-close after 2 seconds when there are no players to rate
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
          // Clear hash from URL if it exists
          if (typeof window !== 'undefined' && window.location.hash === '#rate-players') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          // Navigate to My Sessions > Completed tab
          router.push('/my-sessions?tab=completed');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, pendingReviewPlayers.length, onClose, isLoadingPlayers, router]);

  // Don't render if the modal is not open
  if (!isOpen) return null;

  const playersToRate = pendingReviewPlayers;
  const hasPlayersToRate = playersToRate.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-850 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-700 relative">
            <button
              onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
              aria-label="Close"
            >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Rate Players</h2>
          
          {isLoadingPlayers ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mt-4 text-gray-400">Loading players...</p>
            </div>
          ) : hasPlayersToRate ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select a player to rate
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-gray-500">
                  {playersToRate.map(player => (
                    <div 
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`p-2 rounded-md cursor-pointer flex items-center ${
                        selectedPlayer?.id === player.id 
                          ? 'bg-indigo-900 border border-indigo-500' 
                          : 'bg-gray-750 hover:bg-gray-700'
                      } transition-all duration-150`}
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center overflow-hidden">
                        {player.avatarUrl ? (
                          <Image src={player.avatarUrl} alt={player.name} width={40} height={40} className="object-cover" />
                        ) : (
                          <div className="bg-indigo-600 h-full w-full flex items-center justify-center">
                            <span className="text-white">{player.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-white font-medium">
                          {player.name}
                          {player.id === session.creator.id && (
                            <span className="ml-2 text-xs text-indigo-300">(Host)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedPlayer ? (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="bg-gray-750 p-4 rounded-md mb-4">
                      <h3 className="text-white font-medium mb-2 flex items-center">
                        Rating for {selectedPlayer.name}
                        {selectedPlayer.id === session.creator.id && (
                          <span className="ml-2 text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded">Host</span>
                        )}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm text-gray-300 flex items-center">Skill Level</div>
                        <StarRating value={skillLevel} onChange={(val) => handleRatingChange("skillLevel", val)} />
                        
                        <div className="text-sm text-gray-300 flex items-center">Sportsmanship</div>
                        <StarRating value={sportsmanship} onChange={(val) => handleRatingChange("sportsmanship", val)} />
                        
                        <div className="text-sm text-gray-300 flex items-center">Communication</div>
                        <StarRating value={communication} onChange={(val) => handleRatingChange("communication", val)} />
                        
                        <div className="text-sm text-gray-300 flex items-center">Punctuality</div>
                        <StarRating value={punctuality} onChange={(val) => handleRatingChange("punctuality", val)} />
                        
                        <div className="text-sm text-gray-300 flex items-center">Fair Play</div>
                        <StarRating value={fairPlay} onChange={(val) => handleRatingChange("fairPlay", val)} />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comment (Optional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                        placeholder="Share your experience with this player..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="bg-gray-750 px-4 py-2 rounded-md text-center sm:text-left">
                        <div className="text-xs text-gray-400 mb-1">OVERALL RATING</div>
                        <div className="text-xl font-bold text-yellow-400 flex items-center justify-center sm:justify-start">
                          {calculateOverallRating()}
                          <svg className="w-5 h-5 ml-1 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 justify-end">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                        >
                          Reset
                        </button>
                        
                      <button
                        type="submit"
                        disabled={isSubmitting || !allCategoriesRated()}
                          className={`px-4 py-2 rounded-md font-medium flex items-center justify-center min-w-28 ${
                            isSubmitting
                              ? 'bg-indigo-700 cursor-not-allowed'
                              : allCategoriesRated()
                                ? 'bg-indigo-600 hover:bg-indigo-700' 
                                : 'bg-gray-700 cursor-not-allowed text-gray-400'
                          } transition-colors`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                              Submitting...
                          </>
                        ) : (
                            'Submit Rating'
                        )}
                      </button>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="p-3 bg-red-900/40 border border-red-800 rounded-md text-red-200 text-sm mt-4">
                        {error}
                      </div>
                    )}
                    
                    {success && (
                      <div className="p-3 bg-green-900/40 border border-green-800 rounded-md text-green-200 text-sm mt-4">
                        {success}
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="bg-gray-750 rounded-md p-4 text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <p>Select a player to rate</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-750 p-4 rounded-md text-center">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <h3 className="text-gray-300 font-medium mb-2">No players to rate</h3>
              <p className="text-gray-400 text-sm">You've already rated all players in this session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 