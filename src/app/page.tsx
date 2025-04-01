import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-8">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-5xl font-bold text-white mb-6">Welcome to PickleBall App</h1>
        
        <p className="text-xl text-gray-300 mb-8">
          Connect with other pickleball players, join sessions, and discover new playing locations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Find Sessions</h2>
            <p className="text-gray-300 mb-4">
              Browse and join pickleball sessions in your area. Create your own sessions and invite others.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in to view sessions
            </Link>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Discover Locations</h2>
            <p className="text-gray-300 mb-4">
              Find pickleball courts near you and get playing instructions. You can also request new locations.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in to view locations
            </Link>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
} 