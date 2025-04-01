'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';

interface User {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        router.push('/auth/login');
      }
    } catch (err) {
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const maxSize = 1024 * 1024; // 1MB

    if (file.size > maxSize) {
      // Compress image if it's too large
      const compressed = await compressImage(file);
      if (compressed.size > maxSize) {
        setError('Image is too large. Please choose a smaller image.');
        return;
      }
      await uploadImage(compressed);
    } else {
      await uploadImage(file);
    }
  }

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 800;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
            },
            'image/jpeg',
            0.7
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage(file: File | Blob) {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      console.log('Uploading avatar...');
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      console.log('Avatar uploaded successfully:', data);
      console.log('New avatar URL:', data.avatarUrl);
      
      // Update local state
      setUser(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
      
      // Dispatch auth-state-changed event to update navigation bar
      window.dispatchEvent(new Event('auth-state-changed'));
      
      // Show success message before reloading
      setError(''); // Clear any previous errors
      alert('Profile picture updated successfully! The page will refresh to apply changes.');
      
      // Force a complete page reload to ensure the JWT token is refreshed
      window.location.href = '/profile';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center text-gray-300">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide">Profile Settings</h2>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6 sm:mb-8 flex flex-col items-center">
          <div className="mb-3 sm:mb-4">
            <UserAvatar
              name={user?.name || ''}
              imageUrl={user?.avatarUrl}
              size={90}
            />
          </div>
          <label
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg cursor-pointer transition-colors text-sm sm:text-base"
          >
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-gray-800 shadow-md rounded-lg p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4 sm:mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                readOnly
                defaultValue={user?.email}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="mb-4 sm:mb-6">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={user?.name}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Phone (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user?.phone || ''}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-t-2 border-white rounded-full mr-2"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 