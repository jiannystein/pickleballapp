'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  isApproved: boolean;
  photoUrl?: string;
  bookingUrl?: string;
}

export default function EditLocation() {
  const router = useRouter();
  const params = useParams();
  const locationId = params.locationId as string;
  
  const [location, setLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    instructions: '',
    bookingUrl: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchLocation() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/locations/${locationId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch location');
        }
        
        const data = await res.json();
        setLocation(data);
        setFormData({
          name: data.name,
          address: data.address,
          instructions: data.instructions || '',
          bookingUrl: data.bookingUrl || ''
        });
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Failed to load location data');
      } finally {
        setLoading(false);
      }
    }
    
    if (locationId) {
      fetchLocation();
    }
  }, [locationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelected = (file: File) => {
    setPhotoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // If a new photo is uploaded, handle it separately
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        
        const photoRes = await fetch(`/api/locations/${locationId}/photo`, {
          method: 'POST',
          body: photoFormData
        });
        
        if (!photoRes.ok) {
          const photoData = await photoRes.json();
          throw new Error(photoData.error || 'Failed to upload photo');
        }
      }
      
      // Handle the rest of the form data
      const res = await fetch(`/api/admin/locations/${locationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update location');
      }
      
      setSuccess('Location updated successfully');
      
      // Navigate back to locations admin after successful update
      setTimeout(() => {
        router.push('/admin/locations');
      }, 1500);
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-indigo-400">Loading location data...</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="bg-red-800/30 border border-red-700 text-red-400 p-4 rounded-md mb-6">
        Location not found or you don't have permission to edit it.
        <div className="mt-4">
          <Link href="/admin/locations" className="text-indigo-400 hover:text-indigo-300">
            ← Back to Locations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Location</h1>
        <p className="text-gray-400">Update location details</p>
      </div>

      {error && (
        <div className="bg-red-800/30 border border-red-700 text-red-400 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-800/30 border border-green-700 text-green-400 p-4 rounded-md mb-6">
          {success}
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Location Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="Enter location name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="Enter location address"
              />
            </div>

            <div className="mb-4">
              <ImageUpload 
                onImageSelected={handleImageSelected}
                currentImageUrl={location.photoUrl}
                label="Location Photo (Optional)"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="bookingUrl" className="block text-sm font-medium text-gray-300 mb-1">
                Booking URL (Optional)
              </label>
              <input
                type="text"
                id="bookingUrl"
                name="bookingUrl"
                value={formData.bookingUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="Enter URL for external booking system"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-1">
                Instructions (Optional)
              </label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="Enter any special instructions or details about this location"
              ></textarea>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/admin/locations"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 