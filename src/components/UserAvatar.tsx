import { useState, useEffect } from 'react';
import Image from 'next/image';
import PlayerCard from './PlayerCard';

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  userId?: string;
  showPlayerCard?: boolean;
  playerCardPosition?: 'top' | 'bottom' | 'left' | 'right';
  playerCardTrigger?: 'hover' | 'click';
  portalId?: string;
}

export default function UserAvatar({ 
  name, 
  imageUrl, 
  size = 40, 
  userId,
  showPlayerCard = false,
  playerCardPosition = 'bottom',
  playerCardTrigger = 'hover',
  portalId
}: UserAvatarProps) {
  const [error, setError] = useState(false);
  const [imageVersion, setImageVersion] = useState(Date.now());
  
  // Generate a completely new version number whenever imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      console.log('UserAvatar: URL changed to:', imageUrl);
      setError(false);
      setImageVersion(Date.now());
    } else {
      console.log('UserAvatar: No image URL provided for', name);
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
  
      console.log('UserAvatar: Showing initials for', name, ':', initials);
  
      return (
        <div
          className="rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-gray-700 hover:ring-indigo-400 transition-colors"
          style={{ width: size, height: size }}
        >
          <span className={`${size > 40 ? 'text-base' : 'text-sm'} font-medium tracking-wider`}>{initials}</span>
        </div>
      );
    }
  
    // Add robust cache busting to ensure latest image is displayed
    const cacheBuster = imageVersion || Date.now();
    // Force use of absolute URL to avoid path issues
    const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;
    const imageSrc = absoluteImageUrl.includes('?') 
      ? `${absoluteImageUrl}&v=${cacheBuster}` 
      : `${absoluteImageUrl}?v=${cacheBuster}`;
  
    console.log('UserAvatar: Rendering image with src:', imageSrc);
  
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
            console.error('UserAvatar: Error details:', e);
            setError(true);
          }}
          priority
          unoptimized
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