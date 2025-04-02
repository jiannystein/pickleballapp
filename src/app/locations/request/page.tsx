'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

export default function RequestLocation() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const router = useRouter();

  const handleImageSelected = (file: File) => {
    setPhotoFile(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('name', name);
      formData.append('address', address);
      formData.append('instructions', instructions);
      formData.append('bookingUrl', bookingUrl);
      
      // Add the photo file if selected
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await fetch('/api/locations/request', {
        method: 'POST',
        body: formData, // Using FormData instead of JSON
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit location request');
      }

      router.push('/sessions?message=Location request submitted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit location request');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Request a New Location</h1>
      
      {error && (
        <div className="bg-red-900 text-white px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Location Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Central Park Courts"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
            Address
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., 123 Main St, City, State"
          />
        </div>

        <ImageUpload 
          onImageSelected={handleImageSelected}
          label="Location Photo (Optional)"
          className="mb-2"
        />

        <div>
          <label htmlFor="bookingUrl" className="block text-sm font-medium text-gray-300 mb-2">
            Booking URL (Optional)
          </label>
          <input
            type="text"
            id="bookingUrl"
            value={bookingUrl}
            onChange={(e) => setBookingUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., https://booking-system.com/central-park-courts"
          />
        </div>

        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Enter through the south gate, courts are behind the community center"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting
                ? 'bg-indigo-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
} 