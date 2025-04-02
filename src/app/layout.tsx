import '../lib/env'; // Import environment loader
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/providers/NextAuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import InitializeServer from '@/components/InitializeServer';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SiteFavicon from '@/components/SiteFavicon';
import HydrationFix from '@/components/HydrationFix';
import NotificationIcon from '@/components/NotificationIcon';
import { getSiteMetadata } from '@/lib/siteConfig';

const inter = Inter({ subsets: ['latin'] })

// Force dynamic metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Next.js doesn't allow both metadata and generateMetadata
// export const metadata = {
//   title: 'Pickle Ball App',
//   description: 'Find and join pickle ball sessions near you!',
//   icons: {
//     icon: '/favicon.ico',
//   },
// };

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getSiteMetadata();
  // Ensure consistent favicon path with the default one
  return {
    ...metadata,
    icons: {
      icon: '/uploads/logo/default-favicon.ico',
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Script to suppress Chrome's message port errors globally */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress console errors about message port closing
            const originalConsoleError = console.error;
            console.error = function(...args) {
              if (args.length > 0 && 
                  (typeof args[0] === 'string' && args[0].includes('message port closed') ||
                   args[0] && args[0].message && typeof args[0].message === 'string' && 
                   args[0].message.includes('message port closed'))) {
                return;
              }
              return originalConsoleError.apply(console, args);
            };

            // Handle unhandled promise rejections that might cause the message port errors
            window.addEventListener('unhandledrejection', function(event) {
              if (event && event.reason && 
                  typeof event.reason.message === 'string' && 
                  event.reason.message.includes('message port closed')) {
                event.preventDefault();
                event.stopPropagation();
              }
            });
          `
        }} />
      </head>
      <SiteFavicon />
      <body className={`${inter.className} h-full bg-gray-900 text-gray-100`}>
        <NextAuthProvider>
          <InitializeServer />
          <HydrationFix />
          <ToastProvider />
          <Navigation />
          <main className="pt-16 w-full">
            {children}
          </main>
          <Footer />
          
          {/* Portal container for player cards */}
          <div id="player-card-portal" />
          
          {/* We don't need to add NotificationIcon here as it's already included in the Navigation component */}
        </NextAuthProvider>
      </body>
    </html>
  );
} 