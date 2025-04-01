'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NotificationType } from '@/lib/notifications';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '50');
      
      if (filter === 'unread') {
        queryParams.append('unreadOnly', 'true');
      }
      
      const res = await fetch(`/api/notifications?${queryParams.toString()}`);
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

  async function deleteNotification(notificationId: string) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Remove the notification from state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update unread count if needed
        const wasUnread = notifications.find(n => n.id === notificationId)?.isRead === false;
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function getNotificationTypeLabel(type: NotificationType) {
    switch (type) {
      case NotificationType.SESSION_JOIN:
        return 'Session Join';
      case NotificationType.SESSION_JOIN_REQUEST:
        return 'Join Request';
      case NotificationType.JOIN_REQUEST_APPROVED:
        return 'Request Approved';
      case NotificationType.SESSION_CANCELLED:
        return 'Session Cancelled';
      case NotificationType.SESSION_COMPLETED:
        return 'Session Completed';
      case NotificationType.SESSION_REMINDER:
        return 'Reminder';
      case NotificationType.SESSION_UPDATED:
        return 'Session Updated';
      case NotificationType.SESSION_REVIEW:
        return 'Review Request';
      default:
        return 'Notification';
    }
  }

  function getNotificationIcon(type: NotificationType) {
    switch (type) {
      case NotificationType.SESSION_JOIN:
      case NotificationType.JOIN_REQUEST_APPROVED:
        return (
          <div className="bg-green-900/30 text-green-400 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case NotificationType.SESSION_JOIN_REQUEST:
        return (
          <div className="bg-indigo-900/30 text-indigo-400 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        );
      case NotificationType.SESSION_CANCELLED:
        return (
          <div className="bg-red-900/30 text-red-400 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case NotificationType.SESSION_COMPLETED:
      case NotificationType.SESSION_REVIEW:
        return (
          <div className="bg-yellow-900/30 text-yellow-400 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-700 text-gray-400 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <label htmlFor="filter" className="mr-2 text-sm text-gray-400">Show:</label>
                  <select
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                    className="bg-gray-700 border border-gray-600 rounded-md py-1 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                  </select>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="animate-pulse text-indigo-400">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400">No notifications found</p>
              <Link href="/sessions" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
                Browse Sessions
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex p-6 ${notification.isRead ? 'bg-gray-800' : 'bg-gray-800/80'} hover:bg-gray-700/50 transition-colors`}
                >
                  <div className="mr-4 flex-shrink-0">
                    {getNotificationIcon(notification.type as NotificationType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className={`text-base font-medium ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900 text-indigo-300">
                              New
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            {getNotificationTypeLabel(notification.type as NotificationType)}
                          </span>
                          <span className="mx-2 text-gray-600">•</span>
                          <span className="text-gray-400">{formatDate(notification.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex mt-2 sm:mt-0 space-x-3">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      {notification.message}
                    </p>
                    {notification.linkUrl && (
                      <div className="mt-3">
                        <Link
                          href={notification.linkUrl}
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 transition-colors"
                        >
                          View Details
                          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 