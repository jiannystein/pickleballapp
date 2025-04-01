'use client';

import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  PaperClipIcon, 
  XCircleIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  PhotoIcon, 
  BugAntIcon 
} from '@heroicons/react/24/outline';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    // Reset form state if not submitting
    if (!isSubmitting) {
      setMessage('');
      setFile(null);
      setPreviewUrl(null);
      setSubmitStatus('idle');
      setErrorMessage('');
      onClose();
    }
  };

  const handleFileChange = (file: File) => {
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Only images are allowed.');
      return;
    }

    if (file.size > maxSize) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return;
    }

    setErrorMessage('');
    setFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.add('bg-indigo-900', 'bg-opacity-20', 'border-indigo-500');
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    if (dropAreaRef.current) {
      dropAreaRef.current.classList.remove('bg-indigo-900', 'bg-opacity-20', 'border-indigo-500');
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleFileChange(blob);
          break;
        }
      }
    }
  }, []);

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setErrorMessage('Please provide a message describing the issue.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    
    try {
      let attachmentUrl = null;
      
      // Upload file if exists
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const uploadRes = await axios.post('/api/bug-reports/upload', formData);
          attachmentUrl = uploadRes.data.filePath;
          console.log('File upload response:', uploadRes.data);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setSubmitStatus('error');
          setErrorMessage('File upload failed. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Prepare payload for submission
      const payload = {
        message,
        screenshot: attachmentUrl
      };
      
      console.log('Submitting bug report with data:', payload);
      
      // Try the direct endpoint
      try {
        // Use the direct endpoint that bypasses Prisma issues
        const response = await axios.post('/api/bug-reports/direct', payload);
        console.log('Bug report submission successful:', response.data);
        setSubmitStatus('success');
        
        // Close modal after success
        setTimeout(() => {
          handleClose();
        }, 2000);
      } catch (submitError: any) {
        console.error('Error submitting bug report:', submitError);
        
        // Detailed error message
        let errorMsg = 'Failed to submit bug report. Please try again later.';
        if (submitError?.response?.data?.error) {
          errorMsg = `Error: ${submitError.response.data.error}`;
        }
        if (submitError?.response?.data?.details) {
          errorMsg += ` (${submitError.response.data.details})`;
        }
        
        setSubmitStatus('error');
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      console.error('General error during submission:', error);
      setSubmitStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>
      
      <div 
        className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 md:mx-auto overflow-hidden transform transition-all ring-1 ring-purple-900 ring-opacity-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <BugAntIcon className="h-6 w-6 mr-2 text-indigo-300" />
            Report a Bug
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-200 hover:text-white focus:outline-none transition-colors focus:ring-2 focus:ring-white focus:ring-opacity-40 rounded-full"
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 text-gray-100" onPaste={handlePaste}>
          {submitStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-20 w-20 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center mb-6 border border-green-500 border-opacity-50">
                <CheckCircleIcon className="h-12 w-12 text-green-400" />
              </div>
              <p className="text-center text-gray-100 font-medium text-xl mb-2">Thank you for your report!</p>
              <p className="text-center text-gray-400">Our team will review and address this issue soon.</p>
            </div>
          ) : submitStatus === 'error' ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-20 w-20 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center mb-6 border border-red-500 border-opacity-50">
                <XCircleIcon className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-center text-gray-100 font-medium text-xl mb-2">Something went wrong</p>
              <p className="text-center text-red-400 mb-6">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setSubmitStatus('idle')}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors shadow-lg"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-4 p-3 rounded-md bg-red-900 bg-opacity-30 border-l-4 border-red-500 text-red-300">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}
              
              <div className="mb-5">
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Describe the issue
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 transition-colors"
                  placeholder="Please tell us what happened and how to reproduce the issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={isSubmitting}
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Attach a screenshot (optional)
                </label>
                <div
                  ref={dropAreaRef}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg transition-colors hover:border-indigo-500 group"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {previewUrl ? (
                    <div className="relative w-full">
                      <div className="relative h-48 w-full overflow-hidden rounded-md bg-gray-900">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-red-900 transition-colors"
                        disabled={isSubmitting}
                      >
                        <XMarkIcon className="h-5 w-5 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <PhotoIcon className="mx-auto h-14 w-14 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                      <div className="flex text-sm text-gray-400 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(e.target.files[0]);
                              }
                            }}
                            disabled={isSubmitting}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="mr-4 px-5 py-2.5 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default BugReportModal; 