import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Announcement } from '@/types';
import { NotificationType } from '@/lib/notifications';

interface ExtendedAnnouncement extends Announcement {
  dismissed: boolean;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  sessionId?: string;
  createdAt: string;
}

interface CombinedNotificationsProps {
  className?: string;
}

export default function CombinedNotifications({ className = '' }: CombinedNotificationsProps) {
  // Announcements state
  const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);
  
  // User notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // UI state
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
  const [loading, setLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [hasNewItems, setHasNewItems] = useState(false);
  
  // Group notifications by date
  const groupedNotifications = useCallback(() => {
    if (!notifications.length) return {};
    
    const groups: Record<string, Notification[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = new Date(today - 86400000).getTime();
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      
      let group = 'Older';
      if (dateTime >= today) {
        group = 'Today';
      } else if (dateTime >= yesterday) {
        group = 'Yesterday';
      } else if (dateTime >= today - 7 * 86400000) {
        group = 'This Week';
      }
      
      if (!groups[group]) {
        groups[group] = [];
      }
      
      groups[group].push(notification);
    });
    
    return groups;
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
    fetchAnnouncements();
    
    // Set up intervals to periodically check for new notifications and announcements
    const notificationInterval = setInterval(checkForNewNotifications, 30000);
    const announcementInterval = setInterval(fetchAnnouncements, 60000);
    
    // Add event listener to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current && 
        !bellRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    // Add keyboard navigation for dropdown
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showDropdown) {
        if (event.key === 'Escape') {
          setShowDropdown(false);
        } else if (event.key === 'Tab' && !event.shiftKey) {
          // Handle tabbing inside the dropdown
          event.preventDefault();
          // Focus on first interactive element in dropdown
          const focusableElements = dropdownRef.current?.querySelectorAll('button, a') || [];
          if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
          }
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearInterval(notificationInterval);
      clearInterval(announcementInterval);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  // Check for new notifications without updating loading state
  async function checkForNewNotifications() {
    try {
      const res = await fetch('/api/notifications?limit=10', {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Check if there are new unread notifications
        if (data.unreadCount > unreadCount) {
          setHasNewItems(true);
          // Brief animation to notify the user
          setTimeout(() => setHasNewItems(false), 3000);
        }
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }

  // --- ANNOUNCEMENT FUNCTIONS ---
  async function fetchAnnouncements() {
    try {
      setAnnouncementsLoading(true);
      const res = await fetch('/api/announcements', {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const filteredAnnouncements = data.filter((a: ExtendedAnnouncement) => !a.dismissed);
        
        // Check if there are new announcements
        if (filteredAnnouncements.length > announcements.length) {
          setHasNewItems(true);
          // Brief animation to notify the user
          setTimeout(() => setHasNewItems(false), 3000);
        }
        
        setAnnouncements(filteredAnnouncements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setAnnouncementsLoading(false);
    }
  }

  async function dismissAnnouncement(id: string) {
    try {
      const res = await fetch(`/api/announcements/${id}/dismiss`, {
        method: 'POST'
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  }
  
  async function dismissAllAnnouncements() {
    try {
      const promises = announcements.map(announcement => 
        fetch(`/api/announcements/${announcement.id}/dismiss`, {
          method: 'POST'
        })
      );
      
      await Promise.all(promises);
      setAnnouncements([]);
    } catch (error) {
      console.error('Error dismissing all announcements:', error);
    }
  }

  // --- NOTIFICATION FUNCTIONS ---
  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=10', {
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      
      if (res.ok) {
        // Update the notification in our state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        
        // Decrement unread count if it was unread
        const wasUnread = notifications.find(n => n.id === notificationId)?.isRead === false;
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: true }),
      });
      
      if (res.ok) {
        // Update all notifications in our state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
  }

  function getNotificationIcon(type: NotificationType) {
    switch (type) {
      case NotificationType.SESSION_JOIN:
      case NotificationType.JOIN_REQUEST_APPROVED:
        return (
          <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case NotificationType.SESSION_JOIN_REQUEST:
        return (
          <div className="bg-indigo-900/30 text-indigo-400 p-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        );
      case NotificationType.SESSION_CANCELLED:
        return (
          <div className="bg-red-900/30 text-red-400 p-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case NotificationType.SESSION_COMPLETED:
      case NotificationType.SESSION_REVIEW:
        return (
          <div className="bg-yellow-900/30 text-yellow-400 p-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-700 text-gray-400 p-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  }

  // Calculate if we have any unread items (notifications or announcements)
  const hasUnreadItems = unreadCount > 0 || announcements.length > 0;
  
  // Get notification group keys in order
  const notificationGroupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];
  const notificationGroups = groupedNotifications();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={bellRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 ${className} ${hasNewItems ? 'animate-pulse' : ''}`}
        aria-expanded={showDropdown}
        aria-label="Notifications"
      >
        <svg
          className={`w-6 h-6 ${hasUnreadItems ? 'text-indigo-400' : 'text-gray-400'} hover:text-indigo-400 transition-colors`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {hasUnreadItems && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 border border-gray-700 animate-slideIn"
          style={{
            transformOrigin: 'top right',
            animation: 'slideIn 0.2s ease-out forwards'
          }}
        >
          <div className="px-4 pt-4">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-700 mb-4">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-2 px-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'notifications'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                aria-selected={activeTab === 'notifications'}
                role="tab"
              >
                Notifications {unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-indigo-600 text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`pb-2 px-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'announcements'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                aria-selected={activeTab === 'announcements'}
                role="tab"
              >
                Announcements {announcements.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-indigo-600 text-white">
                    {announcements.length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Content based on active tab */}
            {activeTab === 'notifications' && (
              <div className="animate-fadeIn" role="tabpanel">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                {loading ? (
                  <div className="py-4 text-center text-gray-400">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading notifications...</span>
                    </div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p>No notifications yet</p>
                    <p className="mt-1 text-xs">We'll notify you when something happens</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {notificationGroupOrder.map(groupName => {
                      const groupedItems = notificationGroups[groupName] || [];
                      if (groupedItems.length === 0) return null;
                      
                      return (
                        <div key={groupName} className="mb-4">
                          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
                            {groupName}
                          </h4>
                          <div className="space-y-2">
                            {groupedItems.map((notification) => {
                              const isUnread = !notification.isRead;
                              
                              return (
                                <div 
                                  key={notification.id} 
                                  className={`flex p-3 rounded-lg transition-colors duration-150 ${isUnread ? 'bg-gray-700' : 'bg-gray-800'} hover:bg-gray-700/70`}
                                >
                                  <div className="mr-3 flex-shrink-0">
                                    {getNotificationIcon(notification.type as NotificationType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {notification.linkUrl ? (
                                      <Link 
                                        href={notification.linkUrl} 
                                        onClick={() => markAsRead(notification.id)}
                                        className="block group"
                                      >
                                        <div className="flex justify-between">
                                          <h4 className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-gray-300'} group-hover:text-indigo-300 transition-colors`}>
                                            {notification.title}
                                            {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 ml-2"></span>}
                                          </h4>
                                          <span className="text-xs text-gray-400">
                                            {formatDate(notification.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1 truncate">
                                          {notification.message}
                                        </p>
                                      </Link>
                                    ) : (
                                      <>
                                        <div className="flex justify-between">
                                          <h4 className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-gray-300'}`}>
                                            {notification.title}
                                            {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 ml-2"></span>}
                                          </h4>
                                          <span className="text-xs text-gray-400">
                                            {formatDate(notification.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1 truncate">
                                          {notification.message}
                                        </p>
                                        {isUnread && (
                                          <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
                                          >
                                            Mark as read
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="mt-3 text-center pb-4">
                  <Link
                    href="/notifications"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
            
            {activeTab === 'announcements' && (
              <div className="animate-fadeIn" role="tabpanel">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Announcements</h3>
                  {announcements.length > 0 && (
                    <button
                      onClick={dismissAllAnnouncements}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Dismiss all
                    </button>
                  )}
                </div>
                {announcementsLoading ? (
                  <div className="py-4 text-center text-gray-400">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading announcements...</span>
                    </div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    <p>No announcements</p>
                    <p className="mt-1 text-xs">Check back later for updates</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={`p-3 rounded-lg bg-gray-700/50 border-l-4 hover:bg-gray-700/70 transition-colors duration-150 transform hover:translate-x-1 ${
                          announcement.priority === 'high'
                            ? 'border-red-500'
                            : announcement.priority === 'medium'
                            ? 'border-yellow-500'
                            : 'border-blue-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-white font-medium">
                            {announcement.priority === 'high' && (
                              <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20 mr-2">
                                Important
                              </span>
                            )}
                            {announcement.title}
                          </h4>
                          <button
                            onClick={() => dismissAnnouncement(announcement.id)}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                            aria-label="Dismiss"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="text-gray-300 text-sm mt-2">{announcement.message}</p>
                        {announcement.expiresAt && (
                          <p className="text-gray-400 text-xs mt-2">
                            Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="py-4"></div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slideIn {
          animation: slideIn 0.2s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.5);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 70, 229, 0.7);
        }
      `}</style>
    </div>
  );
} 