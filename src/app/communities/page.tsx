// src/app/communities/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming your firebase config is here

interface Community {
  id: string;
  name: string;
  description: string;
  type: string;
  // Add other relevant fields
}

const CommunitiesPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      setError(null);
      try {
        const communitiesCollection = collection(db, 'communities');
        const communitySnapshot = await getDocs(communitiesCollection);
        const communitiesList = communitySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Community, 'id'>),
        }));
        setCommunities(communitiesList);
      } catch (err) {
        console.error('Error fetching communities:', err);
        setError('Failed to load communities. Please try again later.');
      }
      setLoading(false);
    };

    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Discover Communities</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search communities by name or description..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredCommunities.length === 0 && (
        <p className="text-center text-gray-600">No communities found. Try a different search or check back later!</p>
      )}

      {!loading && !error && filteredCommunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <Link href={`/communities/${community.id}`} key={community.id} legacyBehavior>
              <a className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-700">{community.name}</h2>
                  <p className="text-gray-700 mb-3 text-sm h-20 overflow-hidden text-ellipsis">
                    {community.description || 'No description available.'}
                  </p>
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {community.type || 'General'}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && communities.length > 0 && filteredCommunities.length === 0 && searchTerm !== '' && (
         <p className="text-center text-gray-600 mt-6">No communities match your search term "{searchTerm}".</p>
      )}
    </div>
  );
};

export default CommunitiesPage;
