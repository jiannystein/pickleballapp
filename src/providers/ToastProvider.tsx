'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#1f2937',
          color: '#e5e7eb',
          borderRadius: '0.5rem',
          border: '1px solid #374151',
        },
        success: {
          style: {
            background: '#064e3b',
            border: '1px solid #065f46',
          },
        },
        error: {
          style: {
            background: '#7f1d1d',
            border: '1px solid #991b1b',
          },
        },
      }}
    />
  );
} 