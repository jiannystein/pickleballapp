'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  BugAntIcon,
  UserCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type BugReport = {
  id: string;
  message: string;
  screenshot: string | null;
  status: 'new' | 'completed' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: User;
};

interface BugReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: BugReport | null;
  onUpdateStatus: (reportId: string, status: 'new' | 'completed' | 'dismissed') => void;
  isUpdating: boolean;
}

const BugReportDetailModal: React.FC<BugReportDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  report, 
  onUpdateStatus,
  isUpdating
}) => {
  const [imageError, setImageError] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  
  if (!isOpen || !report) return null;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-900 bg-opacity-30 text-yellow-300 border border-yellow-700">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" /> New
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 bg-opacity-30 text-green-300 border border-green-700">
            <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Completed
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-800 bg-opacity-30 text-gray-300 border border-gray-700">
            <XCircleIcon className="h-4 w-4 mr-1.5" /> Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  // Handle expanding the image to full screen
  const toggleImageExpanded = () => {
    setIsImageExpanded(!isImageExpanded);
  };
  
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div 
        className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 md:mx-auto overflow-hidden transform transition-all ring-1 ring-purple-900 ring-opacity-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <BugAntIcon className="h-6 w-6 mr-2 text-indigo-300" />
            Bug Report #{report.id.substring(0, 8)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-200 hover:text-white focus:outline-none transition-colors focus:ring-2 focus:ring-white focus:ring-opacity-40 rounded-full"
            disabled={isUpdating}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 text-gray-100 max-h-[80vh] overflow-y-auto">
          {/* Status and Actions Section */}
          <div className="mb-8 bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Current Status</h4>
                <div className="mt-1">
                  {getStatusBadge(report.status)}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {report.status !== 'completed' && (
                  <button
                    onClick={() => onUpdateStatus(report.id, 'completed')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 bg-opacity-80 rounded-md text-white hover:bg-green-700 focus:outline-none transition-colors disabled:opacity-50 flex items-center"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Mark Complete
                  </button>
                )}
                
                {report.status !== 'dismissed' && (
                  <button
                    onClick={() => onUpdateStatus(report.id, 'dismissed')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gray-600 rounded-md text-white hover:bg-gray-700 focus:outline-none transition-colors disabled:opacity-50 flex items-center"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Dismiss
                  </button>
                )}
                
                {report.status !== 'new' && (
                  <button
                    onClick={() => onUpdateStatus(report.id, 'new')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-yellow-600 bg-opacity-80 rounded-md text-white hover:bg-yellow-700 focus:outline-none transition-colors disabled:opacity-50 flex items-center"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    Mark New
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side - Message and Attachment */}
            <div className="md:col-span-2 space-y-6">
              {/* Message Section */}
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-lg font-medium text-white flex items-center mb-3">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-indigo-400" />
                  Report Details
                </h4>
                <div className="bg-gray-900 bg-opacity-50 rounded-lg border border-gray-700 p-4 overflow-y-auto max-h-64 whitespace-pre-line">
                  {report.message}
                </div>
              </div>
              
              {/* Attachment Section */}
              {(report.screenshot || (report as any).attachmentUrl) && (
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-medium text-white flex items-center mb-3">
                    <PhotoIcon className="h-5 w-5 mr-2 text-indigo-400" />
                    Attachment
                  </h4>
                  <div className="bg-gray-900 bg-opacity-50 rounded-lg border border-gray-700 p-4">
                    {!imageError ? (
                      <div className="space-y-3">
                        <div className="aspect-video relative overflow-hidden rounded group">
                          <Image
                            src={report.screenshot || (report as any).attachmentUrl}
                            alt="Bug report attachment"
                            className="object-contain w-full h-full transition-transform group-hover:scale-[1.02]"
                            width={800}
                            height={600}
                            onError={() => setImageError(true)}
                          />
                          <div 
                            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3"
                          >
                            <button 
                              onClick={toggleImageExpanded}
                              className="text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
                            >
                              <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <a 
                            href={report.screenshot || (report as any).attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            View Full Size
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ExclamationTriangleIcon className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                        <p className="text-gray-300">Unable to display image</p>
                        <a 
                          href={report.screenshot || (report as any).attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Download Image
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right side - User and Timestamps */}
            <div className="space-y-6">
              {/* User Info Section */}
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-lg font-medium text-white flex items-center mb-3">
                  <UserCircleIcon className="h-5 w-5 mr-2 text-indigo-400" />
                  Reported By
                </h4>
                <div className="bg-gray-900 bg-opacity-50 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center">
                    {report.user?.avatarUrl ? (
                      <div className="flex-shrink-0 h-12 w-12">
                        <Image
                          className="h-12 w-12 rounded-full ring-2 ring-gray-600"
                          src={report.user.avatarUrl}
                          alt={report.user.name}
                          width={48}
                          height={48}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-900 bg-opacity-50 flex items-center justify-center ring-2 ring-gray-600">
                        <span className="text-indigo-300 font-medium">
                          {report.user?.name ? report.user.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-200">
                        {report.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {report.user?.email || ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timestamps Section */}
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-lg font-medium text-white flex items-center mb-3">
                  <ClockIcon className="h-5 w-5 mr-2 text-indigo-400" />
                  Timestamps
                </h4>
                <div className="bg-gray-900 bg-opacity-50 rounded-lg border border-gray-700 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Created:</span>
                    <span className="text-sm text-gray-200">
                      {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Last Updated:</span>
                    <span className="text-sm text-gray-200">
                      {format(new Date(report.updatedAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Full-screen image modal */}
      {isImageExpanded && !imageError && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={toggleImageExpanded}>
          <button 
            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
            onClick={toggleImageExpanded}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="w-full max-w-screen-xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={report.screenshot || (report as any).attachmentUrl || ''}
              alt="Bug report attachment"
              className="object-contain w-full h-full"
              width={1920}
              height={1080}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReportDetailModal; 