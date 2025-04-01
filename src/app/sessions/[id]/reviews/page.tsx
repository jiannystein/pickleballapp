"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import ReviewForm from "./ReviewForm";

interface Session {
  id: string;
  title: string;
  date: string;
  status: string;
  players: {
    id: string;
    name: string;
    avatarUrl?: string;
  }[];
  creator: {
    id: string;
    name: string;
  };
}

interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  sessionId: string;
  overallRating: number;
  skillLevel: number;
  sportsmanship: number;
  communication: number;
  punctuality: number;
  fairPlay: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  reviewee: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export default function SessionReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const sessionId = params.id as string;
  
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track which players the current user has already reviewed
  const [reviewedPlayers, setReviewedPlayers] = useState<Set<string>>(new Set());
  
  // Fetch session data and reviews
  useEffect(() => {
    const fetchSessionAndReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch session details
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        if (!sessionResponse.ok) {
          throw new Error("Failed to fetch session details");
        }
        const sessionData = await sessionResponse.json();
        setSessionData(sessionData);
        
        // Only allow reviews for completed sessions
        if (sessionData.status !== "completed") {
          throw new Error("Reviews can only be submitted for completed sessions");
        }
        
        // Fetch session reviews
        const reviewsResponse = await fetch(`/api/sessions/${sessionId}/reviews`);
        if (!reviewsResponse.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
        
        // Track which players the current user has already reviewed
        if (session?.user?.id) {
          const userReviews = reviewsData.filter(
            (review: Review) => review.reviewerId === session.user.id
          );
          setReviewedPlayers(
            new Set(userReviews.map((review: Review) => review.revieweeId))
          );
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionId && session?.user) {
      fetchSessionAndReviews();
    }
  }, [sessionId, session]);
  
  // Handle refreshing reviews after a new one is submitted
  const handleReviewSubmitted = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to refresh reviews");
      }
      const reviewsData = await response.json();
      setReviews(reviewsData);
      
      // Update the set of players the user has already reviewed
      if (session?.user?.id) {
        const userReviews = reviewsData.filter(
          (review: Review) => review.reviewerId === session.user.id
        );
        setReviewedPlayers(
          new Set(userReviews.map((review: Review) => review.revieweeId))
        );
      }
    } catch (err) {
      console.error("Error refreshing reviews:", err);
    }
  };
  
  // Check if the current user participated in this session
  const didUserParticipate = sessionData?.players.some(
    player => player.id === session?.user?.id
  ) || sessionData?.creator.id === session?.user?.id;
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !sessionData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-800 text-red-100 px-4 py-3 rounded">
          <p>{error || "Session not found"}</p>
          <Link href="/sessions" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
            Return to Sessions
          </Link>
        </div>
      </div>
    );
  }
  
  // Check if session date is in the past
  const isSessionPast = new Date(sessionData.date) < new Date();
  
  // If session is not completed, redirect or show message
  if (sessionData.status !== "completed") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-indigo-900/20 border border-indigo-800 text-indigo-100 px-4 py-3 rounded">
          <h2 className="text-xl font-semibold mb-2">Reviews Not Available</h2>
          <p className="mb-2">
            Reviews can only be submitted for completed sessions. This session is currently marked as {sessionData.status}.
          </p>
          
          {session?.user?.id === sessionData.creator.id && isSessionPast && (
            <div className="mt-4">
              <p className="mb-2">As the host, you can mark this session as completed to enable reviews.</p>
              <Link 
                href={`/sessions/${sessionId}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors inline-flex items-center"
              >
                Go to Session Details
              </Link>
            </div>
          )}
          
          <Link href="/sessions" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
            Return to Sessions
          </Link>
        </div>
      </div>
    );
  }
  
  // If user didn't participate, show message
  if (!didUserParticipate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-100 px-4 py-3 rounded">
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="mb-2">
            Only participants can view and submit reviews for this session.
          </p>
          <Link href="/sessions" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
            Return to Sessions
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={`/sessions/${sessionId}`}
          className="text-indigo-400 hover:text-indigo-300 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Session
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold text-white mb-2">
        Player Reviews: {sessionData.title}
      </h1>
      <p className="text-gray-400 mb-8">
        {new Date(sessionData.date).toLocaleDateString()}
      </p>
      
      {/* Review Forms - for players the current user hasn't reviewed yet */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Submit Reviews</h2>
        
        {sessionData.players.length === 0 && (
          <p className="text-gray-400">No players participated in this session.</p>
        )}
        
        {session?.user?.id === sessionData.creator.id ? (
          // If current user is the host, show review forms for all players
          sessionData.players.map(player => {
            // Skip self-reviews
            if (player.id === session.user.id) return null;
            
            // Skip already reviewed players
            if (reviewedPlayers.has(player.id)) {
              return (
                <div key={player.id} className="bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {player.avatarUrl ? (
                        <Image
                          src={player.avatarUrl}
                          alt={player.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">{player.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{player.name}</p>
                      <p className="text-green-400 text-sm">You've already reviewed this player</p>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <ReviewForm
                key={player.id}
                sessionId={sessionId}
                revieweeId={player.id}
                revieweeName={player.name}
                onReviewSubmitted={handleReviewSubmitted}
              />
            );
          })
        ) : (
          // If current user is a player, only show review form for the host if not already reviewed
          !reviewedPlayers.has(sessionData.creator.id) ? (
            <ReviewForm
              sessionId={sessionId}
              revieweeId={sessionData.creator.id}
              revieweeName={`${sessionData.creator.name} (Host)`}
              onReviewSubmitted={handleReviewSubmitted}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-medium">{sessionData.creator.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{sessionData.creator.name} (Host)</p>
                  <p className="text-green-400 text-sm">You've already reviewed the host</p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
      
      {/* All Reviews Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">All Reviews</h2>
        
        {reviews.length === 0 ? (
          <p className="text-gray-400">No reviews have been submitted yet.</p>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {review.reviewer.avatarUrl ? (
                      <Image
                        src={review.reviewer.avatarUrl}
                        alt={review.reviewer.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{review.reviewer.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">{review.reviewer.name}</span>
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="text-white font-medium">{review.reviewee.name}</span>
                      </div>
                      <div className="flex items-center bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded">
                        <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {review.overallRating.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="text-gray-400 text-xs mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                    
                    {review.comment && (
                      <div className="mt-2 text-gray-300">
                        {review.comment}
                      </div>
                    )}
                    
                    <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-yellow-400">{review.skillLevel}</div>
                        <div className="text-gray-500">Skill</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400">{review.sportsmanship}</div>
                        <div className="text-gray-500">Sportsmanship</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400">{review.communication}</div>
                        <div className="text-gray-500">Communication</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400">{review.punctuality}</div>
                        <div className="text-gray-500">Punctuality</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400">{review.fairPlay}</div>
                        <div className="text-gray-500">Fair Play</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 