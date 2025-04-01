import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { NextAuthProvider } from '@/providers/NextAuthProvider';
import SiteFavicon from '@/components/SiteFavicon';
import { getSiteMetadata } from '@/lib/siteConfig';
import { ToastProvider } from '@/providers/ToastProvider';

const inter = Inter({ subsets: ['latin'] })

// Force dynamic metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getSiteMetadata();
  console.log('Generated metadata for layout:', metadata);
  return metadata;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <SiteFavicon />
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <NextAuthProvider>
          <ToastProvider />
          <Navigation />
          <main className="pt-16">
            {children}
          </main>
          <Footer />
          
          {/* Portal container for player cards */}
          <div id="player-card-portal" />
        </NextAuthProvider>
      </body>
    </html>
  );
} 