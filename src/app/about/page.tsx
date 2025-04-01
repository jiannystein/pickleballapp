'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

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
  mission: string;
  vision: string;
  teamMembers?: TeamMember[];
  features?: FeaturePoint[];
  stats?: StatItem[];
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>({
    aboutTitle: 'About PickleBall App',
    aboutContent: 'Welcome to the PickleBall App, where we connect pickleball players for games, sessions, and events.',
    mission: 'Our mission is to grow the sport of pickleball by connecting players of all skill levels.',
    vision: 'We envision a world where anyone can find pickleball partners and games with just a few taps.',
    teamMembers: [],
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
    ]
  });
  const [loading, setLoading] = useState(true);

  // Function to render the appropriate icon based on icon name
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        );
      case 'calendar':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        );
      case 'location':
        return (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </>
        );
      case 'star':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        );
      case 'trophy':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        );
    }
  };

  useEffect(() => {
    async function fetchAboutContent() {
      try {
        const res = await fetch('/api/site-config');
        if (res.ok) {
          const data = await res.json();
          // Extract about content from site config
          if (data.aboutTitle) {
            const aboutContent: AboutContent = {
              aboutTitle: data.aboutTitle || content.aboutTitle,
              aboutContent: data.aboutContent || content.aboutContent,
              mission: data.mission || content.mission,
              vision: data.vision || content.vision
            };
            
            // Handle team members if available
            if (data.teamMembers) {
              try {
                aboutContent.teamMembers = JSON.parse(data.teamMembers);
              } catch (e) {
                console.error('Error parsing team members:', e);
              }
            }
            
            // Handle features if available
            if (data.features) {
              try {
                aboutContent.features = JSON.parse(data.features);
              } catch (e) {
                console.error('Error parsing features:', e);
                aboutContent.features = content.features;
              }
            } else {
              aboutContent.features = content.features;
            }
            
            // Handle stats if available
            if (data.stats) {
              try {
                aboutContent.stats = JSON.parse(data.stats);
              } catch (e) {
                console.error('Error parsing stats:', e);
                aboutContent.stats = content.stats;
              }
            } else {
              aboutContent.stats = content.stats;
            }
            
            setContent(aboutContent);
          }
        }
      } catch (error) {
        console.error('Error fetching about content:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAboutContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-white mt-4">Loading about page content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Hero section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 relative inline-block">
            {content.aboutTitle}
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-indigo-600 rounded-full transform scale-x-50 mx-auto w-1/3"></div>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Connecting enthusiasts, creating community, and advancing the sport we love.
          </p>
        </motion.div>
        
        {/* Main About Content */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-gray-800 rounded-xl p-8 mb-16 shadow-xl backdrop-blur-sm border border-gray-700"
        >
          <div className="prose prose-invert max-w-none text-gray-300 text-lg">
            <div dangerouslySetInnerHTML={{ __html: content.aboutContent }} />
          </div>
        </motion.div>
        
        {/* Mission and Vision */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          <motion.div 
            variants={fadeIn}
            className="bg-gray-800 rounded-xl p-8 shadow-lg border-l-4 border-indigo-600 transform transition-all duration-300 hover:scale-[1.02]"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Our Mission
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <div dangerouslySetInnerHTML={{ __html: content.mission }} />
            </div>
          </motion.div>
          
          <motion.div 
            variants={fadeIn}
            className="bg-gray-800 rounded-xl p-8 shadow-lg border-l-4 border-indigo-600 transform transition-all duration-300 hover:scale-[1.02]"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Our Vision
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <div dangerouslySetInnerHTML={{ __html: content.vision }} />
            </div>
          </motion.div>
        </motion.div>
        
        {/* Why Choose Us Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 mb-16 shadow-xl"
        >
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">Why Choose Us</h2>
          <motion.div 
            variants={staggerChildren}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {content.features && content.features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                className="flex flex-col items-center text-center p-6 bg-gray-800/50 rounded-xl shadow-md transform transition-all duration-300 hover:shadow-indigo-500/20 hover:bg-gray-800"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {renderIcon(feature.icon)}
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Community Stats */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-16"
        >
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">Community Statistics</h2>
          <motion.div 
            variants={staggerChildren}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {content.stats && content.stats.map((stat, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-center shadow-xl transform transition-all duration-300 hover:translate-y-[-5px]"
              >
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <p className="text-gray-200 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Team Members */}
        {content.teamMembers && content.teamMembers.length > 0 && (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-gray-800 rounded-xl p-8 mb-12 shadow-xl"
          >
            <h2 className="text-2xl font-semibold text-white mb-8 text-center">Our Team</h2>
            <motion.div 
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {content.teamMembers.map((member, index) => (
                <motion.div 
                  key={index} 
                  variants={fadeIn}
                  className="flex flex-col items-center bg-gray-700/70 backdrop-blur-sm rounded-xl p-6 shadow-md border border-gray-600/40 transform transition-all duration-300 hover:shadow-xl hover:border-indigo-500/30"
                >
                  <div className="mb-4 relative w-28 h-28 overflow-hidden rounded-full border-4 border-indigo-600 shadow-lg shadow-indigo-500/30">
                    {member.photoUrl ? (
                      <Image 
                        src={member.photoUrl} 
                        alt={member.name}
                        fill
                        style={{objectFit: 'cover'}}
                        unoptimized={member.photoUrl.startsWith('http')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-800 text-white text-3xl font-medium">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-indigo-400 text-sm font-medium mb-3">{member.role}</p>
                  <p className="text-gray-300 text-sm text-center">{member.bio}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 