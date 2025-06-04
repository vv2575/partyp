'use client'; // Required for hooks like useState and useEffect in Next.js App Router

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase';


; // Adjusted path assuming firebase.js is in src/lib
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

// Define a type for the community data
interface CommunityDocumentData {
  name: string;
  description: string;
  type: string;
  leaderName?: string; // Leader name might not always be present
  memberCount?: number; // Optional as it might not always be present or up-to-date
  createdAt: Timestamp; // Assuming communities have a createdAt field for ordering
}

interface Community extends CommunityDocumentData {
  id: string;
}

export default function Home() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      setError(null);
      try {
        const communitiesRef = collection(db, 'communities');
        const q = query(communitiesRef, orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const communitiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Community[];
        setCommunities(communitiesData);
      } catch (err: any) {
        console.error("Error fetching communities:", err);
        setError(`Failed to load communities. ${err.message}. Please ensure Firebase is configured correctly, Firestore rules allow reads, and the 'communities' collection exists with a 'createdAt' field.`);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-[family-name:var(--font-geist-sans)]">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            CivicLink
          </Link>
          <div className="space-x-2 sm:space-x-4">
            <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Login
            </Link>
            <Link href="/auth/signup" className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
              Sign Up
            </Link>
            <Link href="/profile" className="hidden sm:inline-block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Profile
            </Link>
             <Link href="/communities" className="hidden sm:inline-block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Discover
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center py-10 sm:py-16 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-lg shadow-xl text-white mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Connect, Collaborate, Influence</h1>
          <p className="text-lg sm:text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
            Join vibrant communities, form powerful alliances, and amplify your collective impact on the political landscape.
          </p>
          <Link href="/communities/create" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-150 ease-in-out transform hover:scale-105">
            Create a Community
          </Link>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Featured Communities</h2>
          {loading && <div className="text-center py-4"><p className="text-lg">Loading communities...</p></div>}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error! </strong>
                        <span className="block sm:inline">{error}</span>
                      </div>}
          {!loading && !error && communities.length === 0 && (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-xl mb-4">No communities found yet.</p>
              <p className="mb-6">Be the first to start a movement!</p>
              <Link href="/communities/create" className="text-white bg-blue-600 hover:bg-blue-700 font-medium py-2 px-4 rounded-lg">
                Create One Now
              </Link>
            </div>
          )}
          {!loading && !error && communities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map(community => (
                <div key={community.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <div className="p-6 flex-grow">
                    <h3 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-400">{community.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1"><span className="font-medium">Type:</span> {community.type}</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 h-20 overflow-hidden line-clamp-4">{community.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1"><span className="font-medium">Leader:</span> {community.leaderName || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4"><span className="font-medium">Members:</span> {community.memberCount || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <Link href={`/communities/${community.id}`} className="block text-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-semibold text-sm py-2 px-4 rounded-md bg-blue-100 dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-200 transition-colors">
                      View Community
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && communities.length > 0 && communities.length >=5 && (
             <div className="text-center mt-10">
                <Link href="/communities" className="text-lg text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    View All Communities →
                </Link>
             </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-800 text-center py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 text-sm">&copy; {new Date().getFullYear()} CivicLink. All rights reserved.</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Powered by Next.js and Firebase.
        </p>
      </footer>
    </div>
  );
}

// Notes for the user:
// 1. Ensure Tailwind CSS is installed and configured (e.g., in `tailwind.config.js` and `globals.css`).
//    You might need to add `line-clamp` plugin for Tailwind: `npm install -D @tailwindcss/line-clamp` and add it to `tailwind.config.js` plugins array: `require('@tailwindcss/line-clamp')`.
// 2. Your `src/lib/firebase.js` (or `.ts`) must correctly initialize and export `db` (Firestore instance).
// 3. The 'communities' collection in Firestore should have documents with fields like 'name', 'description', 'type', 'leaderName', 'memberCount', and 'createdAt' (Timestamp type, for ordering).
// 4. Firestore security rules must allow unauthenticated (or authenticated, depending on your app logic) reads from the 'communities' collection for the homepage to display them.
// 5. The Firebase module resolution errors (e.g., 'Cannot find module firebase/firestore') mentioned in memory (ID: 38932758-887a-425c-811d-adcc9130daef) must be resolved for this page to fetch data successfully.
