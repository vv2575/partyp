'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AllianceForm from '@/components/alliances/AllianceForm';
import { createAlliance } from '@/firebase/allianceService';
import { useAuth } from '@/context/AuthContext'; // Assuming an AuthContext provides currentUser
import { Community } from '@/types/community';
import { User } from '@/types/user';
import { Alliance } from '@/types/alliance';
import { getCommunitiesByLeader } from '@/firebase/communityService'; // Assuming this function exists
import styles from './CreateAlliancePage.module.css';

export default function CreateAlliancePage() {
  const { currentUser } = useAuth(); // Get the logged-in user
  const router = useRouter();
  const [userLedCommunities, setUserLedCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const fetchLedCommunities = async () => {
        setLoadingCommunities(true);
        try {
          // You'll need a function like this in your communityService.ts
          const communities = await getCommunitiesByLeader(currentUser.uid);
          setUserLedCommunities(communities);
        } catch (err) {
          console.error('Failed to fetch user-led communities:', err);
          setError('Could not load your communities. Please try again.');
        }
        setLoadingCommunities(false);
      };
      fetchLedCommunities();
    }
  }, [currentUser]);

  const handleSubmit = async (formData: Omit<Alliance, 'allianceId' | 'createdAt' | 'updatedAt' | 'memberCommunityCount' | 'creatorUid' | 'creatorName'>, initialCommunityId: string) => {
    if (!currentUser) {
      setError('You must be logged in to create an alliance.');
      return;
    }
    if (!initialCommunityId) {
        setError('You must select one of your led communities to initiate the alliance.');
        return;
    }

    const initialCommunity = userLedCommunities.find(c => c.communityId === initialCommunityId);
    if (!initialCommunity) {
        setError('Selected initial community not found or you are not its leader.');
        return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const allianceDataForCreation = {
        ...formData,
        creatorUid: currentUser.uid,
        creatorName: currentUser.displayName || 'Unknown Creator',
      };
      const newAllianceId = await createAlliance(allianceDataForCreation, currentUser as User, initialCommunity);
      if (newAllianceId) {
        router.push(`/alliances/${newAllianceId}`);
      } else {
        setError('Failed to create alliance. Please try again.');
      }
    } catch (err: any) {
      console.error('Alliance creation error:', err);
      setError(err.message || 'An unexpected error occurred.');
    }
    setIsSubmitting(false);
  };

  if (!currentUser) {
    return <p className={styles.infoText}>Please log in to create an alliance.</p>;
  }

  if (loadingCommunities) {
    return <p className={styles.infoText}>Loading your communities...</p>;
  }

  return (
    <div className={styles.pageContainer}>
      {error && <p className={styles.errorText}>{error}</p>}
      <AllianceForm 
        currentUser={currentUser as User} 
        userLedCommunities={userLedCommunities} 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
}
