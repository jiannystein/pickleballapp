import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import PlayerCard from './PlayerCard';

// Debug flag to control logging
const DEBUG = process.env.NODE_ENV === 'development' && false; // Set to true only when debugging

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  userId?: string;
  showPlayerCard?: boolean;
  playerCardPosition?: 'top' | 'bottom' | 'left' | 'right';
  playerCardTrigger?: 'hover' | 'click';
  portalId?: string;
  priority?: boolean; // Add priority prop to manually control image loading priority
}

function UserAvatar({ 
  name, 
  imageUrl, 
  size = 40, 
  userId,
  showPlayerCard = false,
  playerCardPosition = 'bottom',
  playerCardTrigger = 'hover',
  portalId,
  priority = false // Default to false
}: UserAvatarProps) {
  const [error, setError] = useState(false);
  const [imageVersion, setImageVersion] = useState(() => Date.now());
  
  // Generate a new version number only when imageUrl actually changes
  useEffect(() => {
    if (imageUrl) {
      if (DEBUG) console.log('UserAvatar: URL changed to:', imageUrl);
      setError(false);
      setImageVersion(Date.now());
    } else {
      if (DEBUG) console.log('UserAvatar: No image URL provided for', name);
    }
  }, [imageUrl, name]);

  const renderAvatar = () => {
    if (!imageUrl || error) {
      // Show initials if no image or if image fails to load
      const initials = name
        .split(' ')
        .map(word => word?.[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2);
  
      if (DEBUG) console.log('UserAvatar: Showing initials for', name, ':', initials);
  
      return (
        <div
          className="rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-gray-700 hover:ring-indigo-400 transition-colors"
          style={{ width: size, height: size }}
        >
          <span className={`${size > 40 ? 'text-base' : 'text-sm'} font-medium tracking-wider`}>{initials}</span>
        </div>
      );
    }
  
    // Add cache busting only when needed
    const cacheBuster = imageVersion;
    // Force use of absolute URL to avoid path issues
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : (typeof window !== 'undefined' ? `${window.location.origin}${imageUrl}` : imageUrl);
    
    const imageSrc = absoluteImageUrl.includes('?') 
      ? `${absoluteImageUrl}&v=${cacheBuster}` 
      : `${absoluteImageUrl}?v=${cacheBuster}`;
  
    if (DEBUG) console.log('UserAvatar: Rendering image with src:', imageSrc);
  
    return (
      <div 
        className="rounded-full overflow-hidden ring-2 ring-gray-700 hover:ring-indigo-400 transition-colors" 
        style={{ width: size, height: size }}
      >
        <Image
          src={imageSrc}
          alt={`${name}'s avatar`}
          width={size}
          height={size}
          className="object-cover"
          onError={(e) => {
            console.error('UserAvatar: Image failed to load:', imageSrc);
            setError(true);
          }}
          priority={priority} // Only use priority for important avatars (like current user)
          loading={priority ? "eager" : "lazy"} // Use lazy loading for non-priority avatars
          sizes={`${size}px`} // Inform the browser about the display size
          quality={80} // Slightly reduce quality for better performance
        />
      </div>
    );
  };

  // If we don't need to show the player card, just return the avatar
  if (!showPlayerCard || !userId) {
    return renderAvatar();
  }

  // If we need to show the player card, wrap the avatar with the PlayerCard component
  return (
    <PlayerCard 
      userId={userId} 
      position={playerCardPosition}
      trigger={playerCardTrigger}
      portalId={portalId}
    >
      {renderAvatar()}
    </PlayerCard>
  );
}

// Export a memoized version to prevent unnecessary re-renders
export default memo(UserAvatar, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.name === nextProps.name && 
         prevProps.imageUrl === nextProps.imageUrl &&
         prevProps.size === nextProps.size &&
         prevProps.userId === nextProps.userId &&
         prevProps.showPlayerCard === nextProps.showPlayerCard &&
         prevProps.priority === nextProps.priority;
}); 