// src/app/communities/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Community } from '../../types/community'; // Use global Community type
import styles from './communities-page.module.css'; // Import CSS module

// SVG Icons (can be moved to a separate icons file if used elsewhere)
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM1.396 16.72a11.912 11.912 0 015.23-3.061 3.002 3.002 0 00-1.265.792 8.913 8.913 0 00-3.014 2.461.75.75 0 101.119.997 7.413 7.413 0 012.604-2.104A1.5 1.5 0 017 14.5h.001c.07 0 .14.008.209.024a4.5 4.5 0 011.89-.666 8.413 8.413 0 001.96.06A4.502 4.502 0 0113 14.5h.001a1.5 1.5 0 011.06.44 7.416 7.416 0 012.605 2.104.75.75 0 101.118-.997 8.912 8.912 0 00-3.013-2.461 3.002 3.002 0 00-1.266-.792 11.915 11.915 0 015.231 3.061.75.75 0 00.8-.997A13.416 13.416 0 007.001 12H7a13.415 13.415 0 00-6.404 3.723.75.75 0 00.8.997z" />
  </svg>
);

const IconPlusCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
    </svg>
);

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
        const communitiesList = communitySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          // id: doc.id, // communityId from data is preferred if it exists and is the true ID
          ...(doc.data() as Community),
          communityId: doc.id, // Ensure communityId is the document ID
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
    (community.description && community.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Explore Communities</h1>
        <Link href="/communities/create" className={`${styles.button} ${styles.buttonAccent}`}>
          <IconPlusCircle /> Create Community
        </Link>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchInputContainer}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search communities by name or description..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className={styles.loadingMessage}>
          <div className={styles.spinner}></div>
          <p>Loading communities...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredCommunities.length === 0 && (
        <div className={styles.noResultsMessage}>
          <p>{searchTerm ? `No communities found matching "${searchTerm}".` : 'No communities available yet. Why not create one?'}</p>
        </div>
      )}

      {!loading && !error && filteredCommunities.length > 0 && (
        <div className={styles.communitiesGrid}>
          {filteredCommunities.map((community) => (
            <Link key={community.communityId} href={`/communities/${community.communityId}`} className={styles.cardLink}>
              <div className={styles.communityCard}>
                <div 
                  className={styles.cardThumbnail}
                  style={{ backgroundImage: `url(${community.thumbnail || 'https://source.unsplash.com/random/400x200/?community,group,abstract'})` }}
                >
                  {/* Placeholder for image or can be a background image */} 
                </div>
                <div className={styles.cardContent}>
                  <h2 className={styles.cardName}>{community.name}</h2>
                  <p className={styles.cardDescription}>
                    {community.description ? 
                      (community.description.length > 100 ? `${community.description.substring(0, 97)}...` : community.description) 
                      : 'No description available.'}
                  </p>
                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      <IconUsers /> {community.memberCount || 0} Members
                    </span>
                    <span className={`${styles.metaItem} ${styles.typeBadge}`}>{community.type}</span>
                  </div>
                  <div className={styles.cardFooter}>
                     {/* The Link wrapping the card makes this button redundant, but kept for style consistency if needed elsewhere */}
                     {/* <button className={`${styles.button} ${styles.buttonSecondary}`}>View Details</button> */}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
