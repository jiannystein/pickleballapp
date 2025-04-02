'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  currentImageUrl?: string;
  className?: string;
  label?: string;
}

export default function ImageUpload({ 
  onImageSelected, 
  currentImageUrl = '', 
  className = '',
  label = 'Upload Image'
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Call the callback with the selected file
    onImageSelected(file);

    // Clean up the preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      
      <div 
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={triggerFileInput}
      >
        {previewUrl ? (
          <div className="relative w-full h-48 border border-gray-600 rounded-md overflow-hidden">
            <Image 
              src={previewUrl} 
              alt="Selected image preview" 
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-md"
              onError={() => setPreviewUrl('/placeholder-image.jpg')}
            />
            {isHovering && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <p className="text-white text-sm">Click to change image</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-700 border border-gray-600 rounded-md flex flex-col items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="mt-2 text-sm text-gray-300">Click to upload an image</p>
          </div>
        )}
      </div>
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <p className="text-xs text-gray-400 mt-1">
        Supported formats: JPEG, PNG, GIF, WebP
      </p>
    </div>
  );
} 