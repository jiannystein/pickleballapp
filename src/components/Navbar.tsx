import Link from 'next/link';
import { useSession } from 'next-auth/react';
import NotificationIcon from './NotificationIcon';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl">
                PickleBall
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/sessions" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Sessions
                </Link>
                {session?.user?.isAdmin && (
                  <Link href="/admin/announcements" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Manage Announcements
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {session?.user && <NotificationIcon />}
            {/* ... existing user menu ... */}
          </div>
        </div>
      </div>
    </nav>
  );
} 