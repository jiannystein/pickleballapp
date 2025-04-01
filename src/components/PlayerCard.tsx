"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';

interface PlayerStats {
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  sessions: {
    created: {
      total: number;
      completed: number;
      cancelled: number;
      active: number;
    };
    joined: {
      total: number;
      completed: number;
      cancelled: number;
      active: number;
    };
    total: number;
  };
  ratings: {
    overall: number;
    skillLevel: number;
    sportsmanship: number;
    communication: number;
    punctuality: number;
    fairPlay: number;
    totalReviews: number;
  };
}

interface PlayerCardProps {
  userId: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger: 'hover' | 'click';
  children: React.ReactNode;
  portalId?: string;
}

export default function PlayerCard({ 
  userId, 
  position = 'bottom', 
  trigger = 'hover', 
  children,
  portalId
}: PlayerCardProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let top = rect.top + scrollY;
      let left = rect.left + scrollX;
      
      // Adjust position based on the specified position prop
      switch (position) {
        case 'top':
          top = rect.top + scrollY - 8;
          left = rect.left + scrollX + (rect.width / 2) - 160; // Center horizontally (320/2 = 160)
          break;
        case 'bottom':
          top = rect.bottom + scrollY + 8;
          left = rect.left + scrollX + (rect.width / 2) - 160;
          break;
        case 'left':
          top = rect.top + scrollY + (rect.height / 2) - 160;
          left = rect.left + scrollX - 328; // Card width (320) + 8px gap
          break;
        case 'right':
          top = rect.top + scrollY + (rect.height / 2) - 160;
          left = rect.right + scrollX + 8;
          break;
      }
      
      // Ensure the card stays within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position if needed
      if (left + 320 > viewportWidth - 16) {
        left = viewportWidth - 336; // 320 + 16px margin
      }
      if (left < 16) {
        left = 16;
      }
      
      // Adjust vertical position if needed
      if (top + 320 > viewportHeight - 16) {
        top = viewportHeight - 336;
      }
      if (top < 16) {
        top = 16;
      }
      
      setCardPosition({ top, left });
    }
  }, [isOpen, position]);

  // Fetch player stats
  const fetchPlayerStats = async () => {
    if (loading || stats) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${userId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch player stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching player stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setIsOpen(true);
      fetchPlayerStats();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      // Add a small delay before closing to make the UI feel smoother
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 300);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
      if (!isOpen) {
        fetchPlayerStats();
      }
    }
  };

  // Star display component
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        <span className="text-lg font-semibold text-yellow-500 mr-1">{rating.toFixed(1)}</span>
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
    );
  };

  const renderCard = () => {
    if (!isOpen) return null;

    const card = (
      <div 
        className="fixed z-[9999]"
        style={{ 
          top: cardPosition.top,
          left: cardPosition.left,
          width: 320
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl p-5 animate-fade-in transition-all duration-200 ease-in-out">
          {loading && (
            <div className="flex flex-col justify-center items-center h-32 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
              <p className="text-gray-400 text-sm animate-pulse">Loading player stats...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900/20 border border-red-800/20 rounded-lg p-3 text-center">
              <p className="text-red-400 text-sm">Error loading player data</p>
              <button 
                onClick={() => {
                  setError(null);
                  fetchPlayerStats();
                }}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}
          
          {stats && (
            <>
              {/* Header with glass effect */}
              <div className="flex items-center mb-6 p-3 rounded-lg bg-gray-700/30 backdrop-blur-sm">
                <div className="mr-4 relative group">
                  {stats.user.avatarUrl ? (
                    <div className="relative">
                      <Image 
                        src={stats.user.avatarUrl} 
                        alt={stats.user.name} 
                        width={56} 
                        height={56} 
                        className="rounded-full ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 transition-all duration-200" 
                      />
                      <div className="absolute inset-0 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-all duration-200"></div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 transition-all duration-200">
                      <span className="text-xl font-semibold text-white">
                        {stats.user.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                    {stats.user.name}
                  </h3>
                  <div className="flex items-center">
                    <StarRating rating={stats.ratings.overall} />
                    <span className="text-gray-400 text-xs ml-2">
                      ({stats.ratings.totalReviews} review{stats.ratings.totalReviews !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Session Stats with hover effects */}
              <div className="mb-6">
                <h4 className="text-gray-300 text-sm font-medium mb-3 px-1">Session Stats</h4>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-lg p-2 text-center transition-all duration-200 cursor-default">
                    <div className="text-lg font-semibold text-white">{stats.sessions.total}</div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                  <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-lg p-2 text-center transition-all duration-200 cursor-default">
                    <div className="text-lg font-semibold text-green-400">{stats.sessions.created.total}</div>
                    <div className="text-xs text-gray-400">Created</div>
                  </div>
                  <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-lg p-2 text-center transition-all duration-200 cursor-default">
                    <div className="text-lg font-semibold text-red-400">
                      {stats.sessions.created.cancelled}
                    </div>
                    <div className="text-xs text-gray-400">Cancelled</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-lg p-2 text-center transition-all duration-200 cursor-default">
                    <div className="text-lg font-semibold text-blue-400">{stats.sessions.joined.total}</div>
                    <div className="text-xs text-gray-400">Joined</div>
                  </div>
                  <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-lg p-2 text-center transition-all duration-200 cursor-default">
                    <div className="text-lg font-semibold text-yellow-400">
                      {stats.sessions.created.completed + stats.sessions.joined.completed}
                    </div>
                    <div className="text-xs text-gray-400">Completed</div>
                  </div>
                  <div className="bg-gray-700/50 hover:bg-gray-700/70 rounded-lg p-2 text-center transition-all duration-200 cursor-default">
                    <div className="text-lg font-semibold text-purple-400">
                      {stats.sessions.joined.cancelled || 0}
                    </div>
                    <div className="text-xs text-gray-400">Leaves</div>
                  </div>
                </div>
              </div>
              
              {/* Rating Breakdown with improved visuals */}
              {stats.ratings.totalReviews > 0 && (
                <div>
                  <h4 className="text-gray-300 text-sm font-medium mb-3 px-1">Rating Breakdown</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Skill Level', value: stats.ratings.skillLevel },
                      { label: 'Sportsmanship', value: stats.ratings.sportsmanship },
                      { label: 'Communication', value: stats.ratings.communication },
                      { label: 'Punctuality', value: stats.ratings.punctuality },
                      { label: 'Fair Play', value: stats.ratings.fairPlay }
                    ].map((rating) => (
                      <div key={rating.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/30 transition-colors">
                        <span className="text-gray-400 text-sm">{rating.label}:</span>
                        <div className="flex items-center">
                          <div className="w-24 h-1.5 bg-gray-700 rounded-full mr-2 overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(rating.value / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-medium">{rating.value.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );

    if (portalId && mounted) {
      const portalElement = document.getElementById(portalId);
      if (portalElement) {
        return createPortal(card, portalElement);
      }
    }

    return card;
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      ref={triggerRef}
    >
      {children}
      {renderCard()}
    </div>
  );
} 