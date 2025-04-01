'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import of the rich text editor to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Add custom CSS for Quill editor
const quillStyles = `
  .ql-editor {
    min-height: 120px;
    font-size: 15px;
    color: #333;
  }
  .ql-toolbar {
    background-color: #f3f4f6;
    border-top-left-radius: 0.375rem;
    border-top-right-radius: 0.375rem;
  }
  .ql-container {
    border-bottom-left-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
  }
`;

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  photoUrl?: string;
}

interface FeaturePoint {
  title: string;
  description: string;
  icon: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface AboutContent {
  aboutTitle: string;
  aboutContent: string;
  tagline: string;
  mission: string;
  vision: string;
  features: FeaturePoint[];
  stats: StatItem[];
  teamMembers: TeamMember[];
}

// Available icons for features
const AVAILABLE_ICONS = [
  { id: 'users', name: 'Users/Community', path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'calendar', name: 'Calendar/Schedule', path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'location', name: 'Location/Map', path: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'star', name: 'Star/Favorite', path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { id: 'trophy', name: 'Trophy/Achievement', path: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' }
];

export default function AdminAboutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [content, setContent] = useState<AboutContent>({
    aboutTitle: 'About PickleBall App',
    aboutContent: '<p>Welcome to the PickleBall App, where we connect pickleball players for games, sessions, and events.</p>',
    tagline: 'Connecting enthusiasts, creating community, and advancing the sport we love.',
    mission: '<p>Our mission is to grow the sport of pickleball by connecting players of all skill levels.</p>',
    vision: '<p>We envision a world where anyone can find pickleball partners and games with just a few taps.</p>',
    features: [
      {
        title: 'Connect with Players',
        description: 'Find and connect with pickleball enthusiasts of all skill levels in your local community.',
        icon: 'users'
      },
      {
        title: 'Easy Scheduling',
        description: 'Create and join sessions with a few clicks. Manage your pickleball schedule effortlessly.',
        icon: 'calendar'
      },
      {
        title: 'Find Locations',
        description: 'Discover pickleball courts and venues near you with detailed information and directions.',
        icon: 'location'
      }
    ],
    stats: [
      { value: '500+', label: 'Active Players' },
      { value: '100+', label: 'Weekly Sessions' },
      { value: '50+', label: 'Locations' },
      { value: '15+', label: 'Cities' }
    ],
    teamMembers: []
  });

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
        fetchAboutContent();
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

  async function fetchAboutContent() {
    try {
      const res = await fetch('/api/site-config');
      if (res.ok) {
        const data = await res.json();
        
        // Update from site config if values exist
        const aboutContent: AboutContent = {
          aboutTitle: data.aboutTitle || content.aboutTitle,
          aboutContent: data.aboutContent || content.aboutContent,
          tagline: data.tagline || content.tagline,
          mission: data.mission || content.mission,
          vision: data.vision || content.vision,
          features: content.features,
          stats: content.stats,
          teamMembers: []
        };
        
        // Parse team members if available
        if (data.teamMembers) {
          try {
            aboutContent.teamMembers = JSON.parse(data.teamMembers);
          } catch (e) {
            console.error('Error parsing team members:', e);
            aboutContent.teamMembers = [];
          }
        }
        
        // Parse features if available
        if (data.features) {
          try {
            aboutContent.features = JSON.parse(data.features);
          } catch (e) {
            console.error('Error parsing features:', e);
          }
        }
        
        // Parse stats if available
        if (data.stats) {
          try {
            aboutContent.stats = JSON.parse(data.stats);
          } catch (e) {
            console.error('Error parsing stats:', e);
          }
        }
        
        setContent(aboutContent);
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRichTextChange = (name: keyof AboutContent) => (value: string) => {
    setContent(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...content.teamMembers];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };
    
    setContent(prev => ({
      ...prev,
      teamMembers: updatedMembers
    }));
  };
  
  const addTeamMember = () => {
    setContent(prev => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        { name: '', role: '', bio: '', photoUrl: '' }
      ]
    }));
  };
  
  const removeTeamMember = (index: number) => {
    const updatedMembers = [...content.teamMembers];
    updatedMembers.splice(index, 1);
    
    setContent(prev => ({
      ...prev,
      teamMembers: updatedMembers
    }));
  };
  
  const handleFeatureChange = (index: number, field: keyof FeaturePoint, value: string) => {
    const updatedFeatures = [...content.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value
    };
    
    setContent(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };
  
  const addFeature = () => {
    if (content.features.length >= 3) {
      setMessage({ text: 'Maximum 3 features can be added', type: 'error' });
      return;
    }
    
    setContent(prev => ({
      ...prev,
      features: [
        ...prev.features,
        { title: '', description: '', icon: 'star' }
      ]
    }));
  };
  
  const removeFeature = (index: number) => {
    const updatedFeatures = [...content.features];
    updatedFeatures.splice(index, 1);
    
    setContent(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };
  
  const handleStatChange = (index: number, field: keyof StatItem, value: string) => {
    const updatedStats = [...content.stats];
    updatedStats[index] = {
      ...updatedStats[index],
      [field]: value
    };
    
    setContent(prev => ({
      ...prev,
      stats: updatedStats
    }));
  };
  
  const addStat = () => {
    if (content.stats.length >= 4) {
      setMessage({ text: 'Maximum 4 stats can be added', type: 'error' });
      return;
    }
    
    setContent(prev => ({
      ...prev,
      stats: [
        ...prev.stats,
        { value: '', label: '' }
      ]
    }));
  };
  
  const removeStat = (index: number) => {
    const updatedStats = [...content.stats];
    updatedStats.splice(index, 1);
    
    setContent(prev => ({
      ...prev,
      stats: updatedStats
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Convert arrays to JSON strings for storage
      const dataToSave = {
        ...content,
        teamMembers: JSON.stringify(content.teamMembers),
        features: JSON.stringify(content.features),
        stats: JSON.stringify(content.stats)
      };
      
      const res = await fetch('/api/site-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (res.ok) {
        setMessage({ text: 'About page content updated successfully!', type: 'success' });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to update about page content', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating about page content:', error);
      setMessage({ text: 'An error occurred', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-white text-center">Loading about page editor...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Rich text editor modules and formats
  const editorModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Edit About Page</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white text-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Add the custom styles for Quill */}
        <style dangerouslySetInnerHTML={{ __html: quillStyles }} />

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
          {/* Title & Tagline */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Page Title & Tagline</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="aboutTitle" className="block text-sm font-medium text-gray-300 mb-1">
                  About Page Title
                </label>
                <input
                  type="text"
                  id="aboutTitle"
                  name="aboutTitle"
                  value={content.aboutTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="tagline" className="block text-sm font-medium text-gray-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  id="tagline"
                  name="tagline"
                  value={content.tagline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter a brief, catchy tagline"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This tagline appears below the title on the About page.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Main Content</h2>
            <div>
              <label htmlFor="aboutContent" className="block text-sm font-medium text-gray-300 mb-1">
                About Content
              </label>
              <div className="bg-white rounded-md">
                {typeof window !== 'undefined' && (
                  <ReactQuill
                    theme="snow"
                    value={content.aboutContent}
                    onChange={handleRichTextChange('aboutContent')}
                    modules={editorModules}
                  />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Note: The text editor has a white background to ensure text is easily visible while editing. Your content will display properly with the dark theme on the public page.
              </p>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Mission & Vision</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="mission" className="block text-sm font-medium text-gray-300 mb-1">
                  Our Mission
                </label>
                <div className="bg-white rounded-md">
                  {typeof window !== 'undefined' && (
                    <ReactQuill
                      theme="snow"
                      value={content.mission}
                      onChange={handleRichTextChange('mission')}
                      modules={editorModules}
                    />
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="vision" className="block text-sm font-medium text-gray-300 mb-1">
                  Our Vision
                </label>
                <div className="bg-white rounded-md">
                  {typeof window !== 'undefined' && (
                    <ReactQuill
                      theme="snow"
                      value={content.vision}
                      onChange={handleRichTextChange('vision')}
                      modules={editorModules}
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0">
                Tip: Use the toolbar above each editor to format your text with headings, lists, and other styles.
              </p>
            </div>
          </div>
          
          {/* Features (Why Choose Us) */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Why Choose Us</h2>
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                disabled={content.features.length >= 3}
              >
                Add Feature
              </button>
            </div>
            
            {content.features.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No features added yet. Click "Add Feature" to create one.</p>
            ) : (
              <div className="space-y-6">
                {content.features.map((feature, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      aria-label="Remove feature"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Icon
                        </label>
                        <select
                          value={feature.icon}
                          onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {AVAILABLE_ICONS.map(icon => (
                            <option key={icon.id} value={icon.id}>{icon.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="md:col-span-3 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={feature.title}
                            onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Feature title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Description
                          </label>
                          <textarea
                            value={feature.description}
                            onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={2}
                            placeholder="Brief description of this feature"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-4">
              The "Why Choose Us" section highlights key benefits of your platform. You can add up to three features.
            </p>
          </div>
          
          {/* Community Stats */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Community Statistics</h2>
              <button
                type="button"
                onClick={addStat}
                className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                disabled={content.stats.length >= 4}
              >
                Add Stat
              </button>
            </div>
            
            {content.stats.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No stats added yet. Click "Add Stat" to create one.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.stats.map((stat, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeStat(index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      aria-label="Remove stat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., 500+"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., Active Players"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-4">
              Community statistics showcase the size and activity of your platform. You can add up to four statistics.
            </p>
          </div>

          {/* Team Members */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Team Members</h2>
              <button
                type="button"
                onClick={addTeamMember}
                className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
              >
                Add Team Member
              </button>
            </div>
            
            {content.teamMembers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No team members added yet. Click "Add Team Member" to create one.</p>
            ) : (
              <div className="space-y-6">
                {content.teamMembers.map((member, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      aria-label="Remove team member"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Team member name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Role
                        </label>
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., Founder & CEO"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Bio
                        </label>
                        <textarea
                          value={member.bio}
                          onChange={(e) => handleTeamMemberChange(index, 'bio', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={2}
                          placeholder="Brief bio of this team member"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Photo URL (optional)
                        </label>
                        <input
                          type="text"
                          value={member.photoUrl || ''}
                          onChange={(e) => handleTeamMemberChange(index, 'photoUrl', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="URL to team member's photo"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Leave empty to use the member's initial as an avatar.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 