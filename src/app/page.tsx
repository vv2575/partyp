'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Community } from '@/types/community';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Hero from '@/components/Hero';
import CommunityCard from '@/components/CommunityCard';
import Link from 'next/link';
import styles from './home-page.module.css'; // Import the CSS module
import HowItWorksSection from '@/components/HowItWorksSection';

export default function Home() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ref = collection(db, 'communities');
      // Fetch top 6 communities, ordered by member count or creation date for relevance
      const q = query(ref, orderBy('memberCount', 'desc'), limit(6)); 
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        communityId: doc.id,
        ...(doc.data() as Omit<Community, 'communityId'>),
      })) as Community[]; // Ensure proper typing after map
      setCommunities(data);
    } catch (e: any) {
      console.error("Error fetching communities:", e);
      setError('Failed to load communities. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  return (
    <div className={styles.pageContainer}>
      <Hero />
      <main className={styles.mainContent}>
        <section className={styles.featuredSection}>
          <h2 className={styles.featuredTitle}>Featured Communities</h2>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading communities...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              {/* Optionally, add a retry button here */}
            </div>
          ) : communities.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No featured communities at the moment.</p>
              {/* Consider styling this link similarly to viewAllButton or a distinct secondary action */}
              <Link href="/communities/create" className="btn btn-accent">Create a Community</Link>
            </div>
          ) : (
            <div className={styles.communitiesGrid}>
              {communities.map(community => (
                <CommunityCard key={community.communityId} community={community} />
              ))}
            </div>
          )}
          {communities.length > 0 && (
            <div className={styles.viewAllButtonContainer}>
              <Link href="/communities" className={styles.viewAllButton}>
                View All Communities
              </Link>
            </div>
          )}
        </section>
        <HowItWorksSection />
      </main>
      {/* Footer can be added here if needed */}
    </div>
  );
}
