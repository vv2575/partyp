'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {createCommunity} from '@/firebase/communityService';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './create.module.css';

export default function CreateCommunityPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'location' | 'expertise'>('location');
  const [basisDetail, setBasisDetail] = useState('');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('You must be logged in to create a community.');
      return;
    }

    if (!name.trim() || !description.trim() || !basisDetail.trim()) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);

    try {
      const communityData = {
        name: name.trim(),
        description: description.trim(),
        type,
        basisDetail: basisDetail.trim(),
        leaderUid: currentUser.uid,
        leaderName: currentUser.displayName || 'Anonymous Leader',
        memberCount: 1, // Initial member is the leader
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Optional fields like bannerImageUrl can be added later
      };
      
      const communityId = await createCommunity(communityData, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous Leader',
        photoURL: currentUser.photoURL || '',
        email: currentUser.email || 'anonymous@example.com',
      });

     if (communityId) {
      router.push(`/communities/${communityId}`);
     } else {
      setError('Failed to create community. Please try again.');
     }
    } catch (err: any) {
      console.error('Error creating community:', err);
      setError(err.message || 'Failed to create community. Please try again.');
    }
    setSubmitting(false);
  };

  if (authLoading || !currentUser) {
    return <div className={styles.loadingText}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Create a New Community</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="communityName">Community Name</label>
            <input
              type="text"
              id="communityName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="communityDescription">Description</label>
            <textarea
              id="communityDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="communityType">Community Type</label>
            <select
              id="communityType"
              value={type}
              onChange={(e) => setType(e.target.value as 'location' | 'expertise')}
              required
            >
              <option value="location">Location-Based</option>
              <option value="expertise">Expertise-Based</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="basisDetail">
              {type === 'location' ? 'Specific Location (e.g., City, State)' : 'Specific Expertise (e.g., Environmental Policy)'}
            </label>
            <input
              type="text"
              id="basisDetail"
              value={basisDetail}
              onChange={(e) => setBasisDetail(e.target.value)}
              placeholder={type === 'location' ? 'e.g., New York City' : 'e.g., Renewable Energy'}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  );
}
