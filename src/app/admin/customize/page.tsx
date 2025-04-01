'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SketchPicker } from 'react-color';
import Image from 'next/image';

interface SiteConfig {
  siteName: string;
  tagline: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  address: string;
  phone: string;
  email: string;
  copyright: string;
  primaryColor: string;
  logo: string;
  favicon?: string;
}

export default function CustomizeSite() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [resettingLogo, setResettingLogo] = useState(false);
  const [config, setConfig] = useState<SiteConfig>({
    siteName: 'PickleBall',
    tagline: 'Connect with fellow pickleball players and join sessions',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    address: '',
    phone: '',
    email: '',
    copyright: `© ${new Date().getFullYear()} PickleBall. All rights reserved.`,
    primaryColor: '#6366f1',
    logo: '/logo.png'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (res.ok && data.isAdmin) {
        setIsAdmin(true);
        fetchSiteConfig();
      } else {
        router.push('/sessions');
      }
    } catch (err) {
      console.error('Error checking admin access:', err);
      router.push('/sessions');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSiteConfig() {
    try {
      const res = await fetch('/api/site-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error fetching site configuration:', error);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorChange = (color: any) => {
    setConfig(prev => ({
      ...prev,
      primaryColor: color.hex
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/site-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setMessage({ text: 'Site configuration updated successfully!', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to update configuration', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating site configuration:', error);
      setMessage({ text: 'An error occurred', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (!file.type.includes('image/png')) {
        setMessage({ text: 'Only PNG files are allowed', type: 'error' });
        return;
      }
      
      setLogoFile(file);
      
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setMessage({ text: 'Please select a logo file first', type: 'error' });
      return;
    }
    
    setUploadingLogo(true);
    setMessage({ text: '', type: '' });
    
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      
      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({
          ...prev,
          logo: data.logo,
          favicon: data.favicon
        }));
        setMessage({ text: 'Logo uploaded successfully!', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to upload logo', type: 'error' });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ text: 'An error occurred while uploading the logo', type: 'error' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const resetLogoPreview = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleResetLogo = async () => {
    try {
      setResettingLogo(true);
      setMessage({ text: '', type: '' });
      
      const res = await fetch('/api/reset-logo', {
        method: 'POST'
      });
      
      if (res.ok) {
        await fetchSiteConfig();
        setMessage({ text: 'Logo reset to default', type: 'success' });
        
        resetLogoPreview();
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to reset logo', type: 'error' });
      }
    } catch (error) {
      console.error('Error resetting logo:', error);
      setMessage({ text: 'An error occurred while resetting the logo', type: 'error' });
    } finally {
      setResettingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-white text-center">Loading site customization options...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Customize Site</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white text-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {message.text && (
          <div 
            className={`p-4 mb-6 rounded ${
              message.type === 'success' ? 'bg-green-800' : 'bg-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Site Identity */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Site Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-300 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  value={config.siteName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This will be displayed as your brand name and used as the site title in browser tabs.
                </p>
              </div>
              <div>
                <label htmlFor="tagline" className="block text-sm font-medium text-gray-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  id="tagline"
                  name="tagline"
                  value={config.tagline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  A short description of your site. This also appears in search results as your site's description.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="logo" className="block text-sm font-medium text-gray-300 mb-1">
                Logo (PNG only)
              </label>
              <div className="space-y-4">
                {config.logo && !logoPreview && (
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-700 p-2 rounded-md inline-block">
                      <div className="relative h-12 w-12">
                        <Image 
                          src={config.logo} 
                          alt="Current logo" 
                          fill 
                          style={{objectFit: 'contain'}}
                          className="rounded-md"
                          unoptimized={config.logo.startsWith('http')} 
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">Current logo</span>
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      disabled={resettingLogo || config.logo === '/logo.png'}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resettingLogo ? 'Resetting...' : 'Reset to Default'}
                    </button>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/png"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-600 file:text-white
                      hover:file:bg-indigo-700
                      file:cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleLogoUpload}
                    disabled={!logoFile || uploadingLogo}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                </div>
                
                {logoPreview && (
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-700 p-2 rounded-md inline-block">
                      <div className="relative h-16 w-16">
                        <Image 
                          src={logoPreview} 
                          alt="New logo preview" 
                          fill 
                          style={{objectFit: 'contain'}}
                          className="rounded-md" 
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetLogoPreview}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-1">
                  Upload a PNG image to use as your site logo. This will also be converted to an icon for the browser tab.
                </p>
              </div>
            </div>
            <div className="mt-4 relative">
              <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-300 mb-1">
                Primary Color
              </label>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded border border-gray-600 cursor-pointer" 
                  style={{ backgroundColor: config.primaryColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <input
                  type="text"
                  id="primaryColor"
                  name="primaryColor"
                  value={config.primaryColor}
                  onChange={handleInputChange}
                  className="ml-3 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {showColorPicker && (
                <div className="absolute z-10 mt-2">
                  <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                  <SketchPicker
                    color={config.primaryColor}
                    onChange={handleColorChange}
                    className="absolute"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Social Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-300 mb-1">
                  Facebook URL
                </label>
                <input
                  type="text"
                  id="facebook"
                  name="facebook"
                  value={config.facebook}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-1">
                  Twitter URL
                </label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={config.twitter}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-300 mb-1">
                  Instagram URL
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={config.instagram}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-300 mb-1">
                  YouTube URL
                </label>
                <input
                  type="text"
                  id="youtube"
                  name="youtube"
                  value={config.youtube}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={config.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={config.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={config.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Footer</h2>
            <div>
              <label htmlFor="copyright" className="block text-sm font-medium text-gray-300 mb-1">
                Copyright Text
              </label>
              <input
                type="text"
                id="copyright"
                name="copyright"
                value={config.copyright}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-900 p-4 border-b border-gray-800">
              <div className="flex items-center">
                <h3 className="text-xl font-bold" style={{ color: config.primaryColor }}>
                  {config.siteName}
                </h3>
                <p className="ml-4 text-sm text-gray-400">{config.tagline}</p>
              </div>
            </div>
            <div className="bg-gray-900 p-4">
              <div className="flex space-x-4">
                {config.facebook && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
                    <span className="text-white">f</span>
                  </div>
                )}
                {config.twitter && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
                    <span className="text-white">t</span>
                  </div>
                )}
                {config.instagram && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
                    <span className="text-white">i</span>
                  </div>
                )}
                {config.youtube && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
                    <span className="text-white">y</span>
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-gray-400">
                {config.copyright}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 