import React from 'react';

interface NotificationBadgeProps {
  count?: number;
  showDot?: boolean;
  className?: string;
}

/**
 * A notification badge component that can display either a count or a dot.
 */
export default function NotificationBadge({ 
  count, 
  showDot = false,
  className = ''
}: NotificationBadgeProps) {
  // Don't render anything if there's no count and no dot to show
  if (!count && !showDot) return null;
  
  // If we have a count, show that number
  if (count && count > 0) {
    return (
      <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ${className}`}>
        {count > 99 ? '99+' : count}
      </span>
    );
  }
  
  // Otherwise just show a dot notification if showDot is true
  if (showDot) {
    return (
      <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ${className}`} />
    );
  }
  
  return null;
} 