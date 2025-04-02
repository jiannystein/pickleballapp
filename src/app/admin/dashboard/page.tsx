'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  
  return (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center">
        <div className="animate-spin h-10 w-10 mb-4 border-t-2 border-b-2 border-indigo-500 rounded-full"></div>
        <div className="text-indigo-400">Redirecting to admin dashboard...</div>
      </div>
    </div>
  );
} 