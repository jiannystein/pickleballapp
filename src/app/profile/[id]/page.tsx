"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import UserAvatar from '@/components/UserAvatar';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  skillLevel?: number;
  createdAt: string;
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
}

interface AverageRatings {
  overall: number;
  skillLevel: number;
  sportsmanship: number;
  communication: number;
  punctuality: number;
  fairPlay: number;
}

export default function ProfilePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const [avgRatings, setAvgRatings] = useState<AverageRatings>({
    overall: 0,
    skillLevel: 0,
    sportsmanship: 0,
    communication: 0,
    punctuality: 0,
    fairPlay: 0
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        
        const userData = await response.json();
        setProfile(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProfile();
    }
  }, [id]);

  // Fetch user reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await fetch(`/api/users/${id}/reviews`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user reviews");
        }
        
        const reviewsData = await response.json();
        setReviews(reviewsData);
        
        // Calculate average ratings
        if (reviewsData.length > 0) {
          const totals = reviewsData.reduce((acc: any, review: Review) => {
            return {
              overall: acc.overall + review.overallRating,
              skillLevel: acc.skillLevel + review.skillLevel,
              sportsmanship: acc.sportsmanship + review.sportsmanship,
              communication: acc.communication + review.communication,
              punctuality: acc.punctuality + review.punctuality,
              fairPlay: acc.fairPlay + review.fairPlay
            };
          }, {
            overall: 0,
            skillLevel: 0,
            sportsmanship: 0,
            communication: 0,
            punctuality: 0,
            fairPlay: 0
          });
          
          const count = reviewsData.length;
          setAvgRatings({
            overall: totals.overall / count,
            skillLevel: totals.skillLevel / count,
            sportsmanship: totals.sportsmanship / count,
            communication: totals.communication / count,
            punctuality: totals.punctuality / count,
            fairPlay: totals.fairPlay / count
          });
        }
      } catch (err) {
        setReviewsError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setReviewsLoading(false);
      }
    };
    
    if (id) {
      fetchReviews();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-gray-700"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-6"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-800 text-red-100 px-4 py-3 rounded">
          <p>{error || "User not found"}</p>
          <Link href="/sessions" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
            Return to Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="relative">
            <UserAvatar
              name={profile.name}
              imageUrl={profile.avatarUrl}
              userId={profile.id}
              showPlayerCard={false}
              size={128}
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{profile.name}</h1>
            
            {/* Rating display */}
            <div className="flex items-center mb-3">
              <div className="bg-indigo-900 text-indigo-200 py-1 px-3 rounded-full flex items-center text-sm">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {profile.rating ? profile.rating.toFixed(1) : "0.0"} Rating
              </div>
              <span className="ml-2 text-gray-400 text-sm">
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
            
            {/* Member Since */}
            <p className="text-gray-400 text-sm mb-4">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
            
            {/* If it's the current user viewing their own profile, add an edit button */}
            {session?.user?.id === id && (
              <Link 
                href="/profile/edit" 
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Player Reviews Section */}
      <div className="mt-8 bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Player Reviews</h2>
        
        {reviewsLoading ? (
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        ) : reviewsError ? (
          <div className="text-red-400 text-sm">{reviewsError}</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-400 text-center py-6">
            This player has not received any reviews yet.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgRatings.overall.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Overall</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgRatings.skillLevel.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Skill</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgRatings.sportsmanship.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Sportsmanship</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgRatings.communication.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Communication</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgRatings.punctuality.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Punctuality</div>
              </div>
            </div>
            
            {/* Individual reviews */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">Recent Reviews</h3>
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b border-gray-700 pb-4 mb-4 last:border-0">
                  <div className="flex items-start mb-2">
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
                        <div className="text-white font-medium">{review.reviewer.name}</div>
                        <div className="flex items-center bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded">
                          <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {review.overallRating.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      {review.comment && (
                        <div className="mt-2 text-gray-300 text-sm">
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
              
              {reviews.length > 5 && (
                <div className="text-center">
                  <button 
                    className="text-indigo-400 hover:text-indigo-300 text-sm focus:outline-none"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? "Show Less" : `Show ${reviews.length - 5} More Reviews`}
                  </button>
                </div>
              )}
              
              {showAllReviews && reviews.slice(5).map((review) => (
                <div key={review.id} className="border-b border-gray-700 pb-4 mb-4 last:border-0">
                  <div className="flex items-start mb-2">
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
                        <div className="text-white font-medium">{review.reviewer.name}</div>
                        <div className="flex items-center bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded">
                          <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {review.overallRating.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      {review.comment && (
                        <div className="mt-2 text-gray-300 text-sm">
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
          </div>
        )}
      </div>
    </div>
  );
} 