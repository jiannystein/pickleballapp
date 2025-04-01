"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import StarRating from "./StarRating";

interface ReviewFormProps {
  sessionId: string;
  revieweeId: string;
  revieweeName: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({
  sessionId,
  revieweeId,
  revieweeName,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { data: session } = useSession();
  const [skillLevel, setSkillLevel] = useState(0);
  const [sportsmanship, setSportsmanship] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [fairPlay, setFairPlay] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Calculate overall rating
  const calculateOverallRating = () => {
    const ratings = [skillLevel, sportsmanship, communication, punctuality, fairPlay];
    const validRatings = ratings.filter(rating => rating > 0);
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((total, rating) => total + rating, 0);
    return sum / validRatings.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setError("");
    
    // Check if user is logged in
    if (!session?.user) {
      setError("You must be logged in to submit a review");
      return;
    }
    
    // Validate that all rating fields have values
    if (skillLevel === 0 || sportsmanship === 0 || communication === 0 || punctuality === 0 || fairPlay === 0) {
      setError("Please provide ratings for all categories");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/sessions/${sessionId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          revieweeId,
          skillLevel,
          sportsmanship,
          communication,
          punctuality,
          fairPlay,
          comment: comment.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }
      
      // Clear form and show success message
      setSkillLevel(0);
      setSportsmanship(0);
      setCommunication(0);
      setPunctuality(0);
      setFairPlay(0);
      setComment("");
      setSuccess(true);
      setIsFormOpen(false);
      
      // Call the callback to refresh reviews
      onReviewSubmitted();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (field: string, val: number) => {
    switch (field) {
      case "skillLevel":
        setSkillLevel(val);
        break;
      case "sportsmanship":
        setSportsmanship(val);
        break;
      case "communication":
        setCommunication(val);
        break;
      case "punctuality":
        setPunctuality(val);
        break;
      case "fairPlay":
        setFairPlay(val);
        break;
    }
  };

  if (success) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-medium">{revieweeName.charAt(0)}</span>
          </div>
          <div>
            <p className="text-white font-medium">{revieweeName}</p>
            <p className="text-green-400 text-sm">Review submitted successfully</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      {isFormOpen ? (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-medium">{revieweeName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-white font-medium">{revieweeName}</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
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
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">
                Comment (Optional)
              </label>
              <textarea
                id="comment"
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                placeholder="Share your experience with this player..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors flex items-center"
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
                  "Submit Review"
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-medium">{revieweeName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-white font-medium">{revieweeName}</p>
            </div>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
          >
            Write Review
          </button>
        </div>
      )}
    </div>
  );
} 