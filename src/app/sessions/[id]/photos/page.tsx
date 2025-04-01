'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';

interface Photo {
  id: string;
  photoUrl: string;
  caption?: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface Session {
  id: string;
  title: string;
  status: string;
  creatorId: string;
  players: {
    id: string;
  }[];
}

export default function SessionPhotos({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userRes.ok) {
          setUserId(userData.userId);
        }

        // Fetch session data
        const sessionRes = await fetch(`/api/sessions/${params.id}`);
        if (!sessionRes.ok) {
          throw new Error('Failed to fetch session');
        }
        const sessionData = await sessionRes.json();
        setSession(sessionData);

        // Fetch session photos
        const photosRes = await fetch(`/api/sessions/${params.id}/photos`);
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(photosData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Check file size - max 30MB
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Please select a file less than 30MB.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('Creating Image object for compression');
        // Use the native HTML Image constructor, not the Next.js Image component
        const img = new window.Image();
        
        img.onload = () => {
          console.log('Image loaded with dimensions:', img.width, 'x', img.height);
          // Max dimension (width or height) for compression
          const MAX_DIMENSION = 1200;
          
          // Determine compression quality based on file size
          let quality = 0.75; // Default quality
          
          if (file.size > 10 * 1024 * 1024) { // > 10MB
            quality = 0.6; 
          } else if (file.size > 5 * 1024 * 1024) { // > 5MB
            quality = 0.7;
          } else if (file.size < 1 * 1024 * 1024) { // < 1MB
            quality = 0.85;
          }
          console.log('Using compression quality:', quality);
          
          // Calculate dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
          console.log('Resizing to dimensions:', width, 'x', height);
          
          // Create a canvas element
          console.log('Creating canvas for image manipulation');
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('Failed to get canvas 2D context');
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          try {
            ctx.drawImage(img, 0, 0, width, height);
            console.log('Image drawn on canvas successfully');
          } catch (drawError) {
            console.error('Error drawing image to canvas:', drawError);
            reject(new Error('Failed to draw image on canvas'));
            return;
          }
          
          // Convert to blob with compression
          console.log('Converting canvas to blob');
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('Blob created successfully, size:', blob.size);
                resolve(blob);
              } else {
                console.error('Failed to create blob from canvas');
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            file.type,
            quality
          );
        };
        
        img.onerror = () => {
          console.error('Image loading error');
          reject(new Error('Failed to load image'));
        };
        
        console.log('Setting image source from file');
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        
        // Clean up object URL when done
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 30000); // 30 seconds timeout for safety
      } catch (err) {
        console.error('Unexpected error in image compression:', err);
        reject(err);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    // Basic validation
    if (!selectedFile.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File too large. Please select a file less than 30MB.`);
      return;
    }

    setPhotoLoading(true);
    setError('');

    try {
      console.log('Starting photo upload process');
      // Check if the browser supports canvas compression
      const isCanvasSupported = !!document.createElement('canvas').getContext('2d');
      console.log('Canvas compression supported:', isCanvasSupported);
      
      let fileToUpload: File;
      let compressionStats = '';
      
      // Compress the image before uploading if browser supports it
      if (isCanvasSupported) {
        try {
          console.log('Attempting to compress image');
          const compressedBlob = await compressImage(selectedFile);
          console.log('Image compressed successfully');
          
          // Create a new file from the compressed blob
          fileToUpload = new File(
            [compressedBlob], 
            selectedFile.name,
            { type: selectedFile.type }
          );
          
          const originalSizeKB = (selectedFile.size / 1024).toFixed(2);
          const compressedSizeKB = (compressedBlob.size / 1024).toFixed(2);
          const compressionRatio = ((1 - (compressedBlob.size / selectedFile.size)) * 100).toFixed(1);
          
          compressionStats = `Original: ${originalSizeKB}KB, Compressed: ${compressedSizeKB}KB (${compressionRatio}% reduction)`;
          console.log('Compression stats:', compressionStats);
        } catch (err) {
          console.error('Error compressing image:', err);
          // Fallback to using original file if compression fails
          fileToUpload = selectedFile;
          compressionStats = 'Compression failed, using original file';
        }
      } else {
        // Fallback for browsers that don't support canvas
        fileToUpload = selectedFile;
        compressionStats = 'Your browser does not support image compression';
      }
      
      console.log('Creating form data for upload');
      const formData = new FormData();
      formData.append('photo', fileToUpload);
      if (caption) {
        formData.append('caption', caption);
      }

      console.log('Sending fetch request to upload photo');
      const res = await fetch(`/api/sessions/${params.id}/photos`, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', res.status);
      const data = await res.json();
      console.log('Upload response data:', data);
      
      if (!res.ok) {
        console.error('Upload error - status:', res.status, 'error:', data.error);
        throw new Error(data.error || 'Failed to upload photo');
      }

      console.log('Photo uploaded successfully, updating UI');
      // Add new photo to the list
      setPhotos(prev => [data, ...prev]);
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      
      // Set success state for temporary UI feedback instead of alert
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Hide after 3 seconds
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const canUploadPhoto = () => {
    if (!session || !userId) return false;
    
    // Check if user is creator or has joined the session
    return session.creatorId === userId || 
           session.players.some(player => player.id === userId);
  };

  const openPhotoModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsModalOpen(false);
  };

  const PhotoModal = () => {
    if (!selectedPhoto) return null;
    
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if the backdrop itself was clicked, not its children
      if (e.target === e.currentTarget) {
        closePhotoModal();
      }
    };
    
    const isOwner = selectedPhoto.uploadedBy.id === userId;
    
    return (
      <div 
        className={`fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}
        onClick={handleBackdropClick}
      >
        <div className="relative w-full max-w-4xl max-h-screen flex flex-col">
          {/* Close button */}
          <button 
            onClick={closePhotoModal}
            className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          
          <div className="relative overflow-hidden rounded-lg bg-gray-900 h-auto max-h-[80vh]">
            <div className="flex items-center justify-center">
              <Image 
                src={selectedPhoto.photoUrl} 
                alt={selectedPhoto.caption || "Session photo"}
                width={1200}
                height={800}
                className="object-contain max-h-[80vh] w-auto h-auto"
                priority
              />
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-b-lg">
            {selectedPhoto.caption && (
              <p className="text-white mb-2">{selectedPhoto.caption}</p>
            )}
            <div className="flex items-center">
              <UserAvatar
                name={selectedPhoto.uploadedBy.name}
                imageUrl={selectedPhoto.uploadedBy.avatarUrl}
                userId={selectedPhoto.uploadedBy.id}
                showPlayerCard={true}
                size={36}
                playerCardTrigger="hover"
              />
              <div className="ml-2">
                <p className="text-white">{selectedPhoto.uploadedBy.name}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add event listener for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePhotoModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  // Function to handle deleting a photo
  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal when clicking delete
    if (isDeletingPhoto) return;
    
    if (confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      setIsDeletingPhoto(true);
      setDeletePhotoId(photoId);
      
      try {
        const res = await fetch(`/api/sessions/${params.id}/photos/${photoId}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          // Remove the deleted photo from state
          setPhotos(prev => prev.filter(photo => photo.id !== photoId));
          // If the deleted photo is currently selected in the modal, close the modal
          if (selectedPhoto && selectedPhoto.id === photoId) {
            closePhotoModal();
          }
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to delete photo');
        }
      } catch (err) {
        console.error('Error deleting photo:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while deleting the photo');
      } finally {
        setIsDeletingPhoto(false);
        setDeletePhotoId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white">Loading session photos...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-red-500">Session not found</div>
          <div className="text-center mt-4">
            <Link href="/sessions" className="text-indigo-400 hover:text-indigo-300">
              ← Back to Sessions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Photos for {session.title}
          </h1>
          <Link
            href={`/sessions/${params.id}`}
            className="text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Session
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {canUploadPhoto() && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-medium text-white mb-4">Upload New Photo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-600 file:text-white
                    hover:file:bg-indigo-700
                    file:cursor-pointer"
                />
              </div>

              {previewUrl && (
                <div className="mt-2">
                  <div className="relative w-40 h-40 overflow-hidden rounded-lg">
                    <Image 
                      src={previewUrl} 
                      alt="Preview" 
                      width={160}
                      height={160}
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption to your photo"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!selectedFile || photoLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {photoLoading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </form>
          </div>
        )}

        {success && (
          <div className="mt-2 bg-green-900/40 border border-green-700 text-green-100 px-4 py-2 rounded-md flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Photo uploaded successfully
          </div>
        )}

        {photos.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-lg">No photos have been shared yet</p>
              {canUploadPhoto() && (
                <p className="mt-1">Be the first to upload a photo from this session!</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer relative group" onClick={() => openPhotoModal(photo)}>
                <div className="relative h-48 w-full">
                  <Image
                    src={photo.photoUrl}
                    alt={photo.caption || "Session photo"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                  
                  {/* Delete button - only visible for photos uploaded by the current user */}
                  {photo.uploadedBy.id === userId && (
                    <button 
                      onClick={(e) => handleDeletePhoto(photo.id, e)}
                      className={`absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                        deletePhotoId === photo.id ? 'opacity-70 pointer-events-none' : ''
                      }`}
                      aria-label="Delete photo"
                      disabled={isDeletingPhoto}
                    >
                      {deletePhotoId === photo.id ? (
                        <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {photo.caption && (
                    <p className="text-gray-300 mb-2 line-clamp-1">{photo.caption}</p>
                  )}
                  <div className="flex items-center mt-2">
                    <UserAvatar
                      name={photo.uploadedBy.name}
                      imageUrl={photo.uploadedBy.avatarUrl}
                      userId={photo.uploadedBy.id}
                      showPlayerCard={true}
                      size={32}
                      playerCardTrigger="hover"
                    />
                    <div className="ml-2">
                      <p className="text-sm text-white">{photo.uploadedBy.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(photo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedPhoto && <PhotoModal />}
    </div>
  );
} 