'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Location {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  bookingUrl?: string;
  photoUrl?: string;
  isApproved: boolean;
}

export default function EditLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    instructions: '',
    bookingUrl: ''
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const locationId = params.id as string;

  useEffect(() => {
    checkAdminAccess();
    fetchLocationData();
  }, [locationId]);

  async function checkAdminAccess() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.isAdmin) {
        router.push('/sessions');
      }
    } catch (err) {
      router.push('/sessions');
    }
  }

  async function fetchLocationData() {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`/api/locations/${locationId}`);
      const data = await res.json();
      
      if (res.ok) {
        setLocation(data);
        setFormData({
          name: data.name || '',
          address: data.address || '',
          instructions: data.instructions || '',
          bookingUrl: data.bookingUrl || ''
        });
        if (data.photoUrl) {
          setPhotoPreview(data.photoUrl);
        }
      } else {
        setError(`Failed to fetch location: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error fetching location data:', err);
      setError('Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setError('');
      setUpdateSuccess('');
      
      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (res.ok) {
        setUpdateSuccess('Location updated successfully');
        setLocation(data);
      } else {
        setError(`Failed to update location: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to update location');
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setError('Please select a photo to upload');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');
      setPhotoSuccess('');
      
      const formData = new FormData();
      formData.append('photo', photo);
      
      const res = await fetch(`/api/locations/${locationId}/photo`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        setPhotoSuccess('Photo uploaded successfully');
        setLocation(prev => {
          if (!prev) return null;
          return { ...prev, photoUrl: data.photoUrl };
        });
      } else {
        setError(`Failed to upload photo: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!location) {
    return <div className="p-4">Location not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Edit Location</h1>
        <Link href="/admin" className="text-sm text-blue-500 hover:text-blue-400">
          Back to Admin Dashboard
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-900 text-white px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {updateSuccess && (
        <div className="bg-green-900 text-white px-4 py-3 rounded-md mb-4">
          {updateSuccess}
        </div>
      )}
      
      <div className="bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Location Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={3}
              className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="bookingUrl" className="block text-sm font-medium text-gray-300 mb-1">
              Booking URL
            </label>
            <input
              type="url"
              id="bookingUrl"
              name="bookingUrl"
              value={formData.bookingUrl}
              onChange={handleInputChange}
              className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/booking-link"
            />
            <p className="mt-1 text-xs text-gray-400">
              Optional: Link where users can book or reserve this location
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-1">
              Instructions (Optional)
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows={5}
              className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter instructions for finding this location..."
            />
          </div>
          
          <button
            type="submit"
            disabled={updating}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              updating ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {updating ? 'Updating...' : 'Update Location'}
          </button>
        </form>
      </div>
      
      <div className="bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4">Location Photo</h2>
        
        {photoSuccess && (
          <div className="bg-green-900 text-white px-4 py-3 rounded-md mb-4">
            {photoSuccess}
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 relative border border-gray-600 rounded-md overflow-hidden bg-gray-700 flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">No photo</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-2">
                {location.photoUrl ? 'Update the location photo:' : 'Add a photo for this location:'}
              </p>
              <form onSubmit={handlePhotoUpload} className="space-y-4">
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!photo || uploadingPhoto}
                  className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    !photo || uploadingPhoto ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 