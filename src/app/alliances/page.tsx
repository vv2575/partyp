'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AllianceForm from '@/components/alliances/AllianceForm';
import { createAlliance, getAllAlliances } from '@/firebase/allianceService';
import { useAuth } from '@/context/AuthContext';
import { Community } from '@/types/community';
import { User } from '@/types/user';
import { Alliance } from '@/types/alliance';
// Timestamp import might not be directly used in this component after changes,
// but good to keep if AllianceForm or services rely on it being passed.
// import { Timestamp } from 'firebase/firestore';
import { getCommunitiesByLeader } from '@/firebase/communityService';
import styles from './AlliancesPage.module.css';

export default function AlliancesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [userLedCommunities, setUserLedCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [loadingAlliances, setLoadingAlliances] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const fetchLedCommunities = async () => {
        setLoadingCommunities(true);
        try {
          const communities = await getCommunitiesByLeader(currentUser.uid);
          setUserLedCommunities(communities);
        } catch (err) {
          console.error('Failed to fetch user-led communities:', err);
          setError('Could not load your communities. Please try again.');
        }
        setLoadingCommunities(false);
      };
      fetchLedCommunities();
    } else {
      setLoadingCommunities(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchAlliances = async () => {
      setLoadingAlliances(true);
      setError(null); // Clear previous errors
      try {
        const fetchedAlliances = await getAllAlliances();
        setAlliances(fetchedAlliances);
      } catch (err) {
        console.error('Failed to fetch alliances:', err);
        setError('Could not load alliances. Please try again.');
      }
      setLoadingAlliances(false);
    };
    fetchAlliances();
  }, []);

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
      setError('Selected community not found in your led communities.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const allianceDataForCreation: Omit<Alliance, 'allianceId' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        description: formData.description,
        creatorUid: currentUser.uid,
        creatorName: currentUser.displayName || 'Unknown Creator',
        memberCommunityCount: 1,
      };

      if (formData.bannerImageUrl) {
        allianceDataForCreation.bannerImageUrl = formData.bannerImageUrl;
      }
      const newAllianceId = await createAlliance(
        allianceDataForCreation,
        {
          ...currentUser, // Spreading AppUser
          uid: currentUser.uid,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL === null ? undefined : currentUser.photoURL,
        },
        initialCommunity
      );
      if (newAllianceId) {
        router.push(`/alliances/${newAllianceId}`);
        setShowCreateForm(false);
        // Refetch alliances to show the new one
        setLoadingAlliances(true);
        const fetchedAlliances = await getAllAlliances();
        setAlliances(fetchedAlliances);
        setLoadingAlliances(false);
      } else {
        setError('Failed to create alliance. Please try again.');
      }
    } catch (err: any) {
      console.error('Alliance creation error:', err);
      setError(err.message || 'An unexpected error occurred.');
    }
    setIsSubmitting(false);
  };

  if (!currentUser && showCreateForm) {
     // If trying to show form but not logged in, redirect or show login message within form section
     // For now, AllianceForm itself should handle the currentUser prop being null or have a check
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Alliances</h1>
      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.createButtonContainer}>
        {!showCreateForm && (
          <button
            onClick={() => {
              if (currentUser) {
                setShowCreateForm(true);
                setError(null); // Clear errors when opening form
              } else {
                setError("Please log in to create an alliance.");
                // router.push('/auth/login'); // Or redirect to login
              }
            }}
            className={`${styles.actionButton} ${styles.createAllianceButton}`}
          >
            Create New Alliance
          </button>
        )}
      </div>

      {showCreateForm ? (
        <div className={styles.formSection}>
          {currentUser ? (
            <>
              {loadingCommunities ? (
                <p className={styles.infoText}>Loading your communities...</p>
              ) : (
                <AllianceForm
                  currentUser={currentUser as User}
                  userLedCommunities={userLedCommunities}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
              <button
                onClick={() => setShowCreateForm(false)}
                className={`${styles.actionButton} ${styles.cancelButton}`}
                style={{ display: 'block', margin: '24px auto 0' }} // Center cancel button
              >
                Cancel Creation
              </button>
            </>
          ) : (
             <p className={styles.infoText}>Please log in to create an alliance.</p>
             // Optionally, add a login button here
          )}
        </div>
      ) : (
        <>
          {loadingAlliances ? (
            <p className={styles.infoText}>Loading alliances...</p>
          ) : alliances.length > 0 ? (
            <ul className={styles.allianceList}>
              {alliances.map((alliance) => (
                <li key={alliance.allianceId} className={styles.allianceCard}>
                  {alliance.bannerImageUrl && (
                    <img 
                      src={alliance.bannerImageUrl} 
                      alt={`${alliance.name} banner`} 
                      className={styles.allianceBannerImage} 
                    />
                  )}
                  <div> {/* Added a div to group text content for better flex control if needed */}
                    <Link href={`/alliances/${alliance.allianceId}`} className={styles.allianceLink}>
                      <h2 className={styles.allianceName}>{alliance.name}</h2>
                    </Link>
                    {alliance.creatorName && (
                      <p className={styles.allianceCreator}>Created by: {alliance.creatorName}</p>
                    )}
                    <p className={styles.allianceDescription}>{alliance.description}</p>
                  </div>
                  <div style={{ marginTop: 'auto' }}> {/* Wrapper to push count and link to bottom */}
                    <span className={styles.allianceMemberCount}>
                      Member Communities: {alliance.memberCommunityCount}
                    </span>
                    <Link href={`/alliances/${alliance.allianceId}`} className={styles.viewAllianceLink}>
                      View Alliance
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !error && <p className={styles.infoText}>No alliances found. Be the first to create one!</p>
          )}
        </>
      )}
    </div>
  );
}