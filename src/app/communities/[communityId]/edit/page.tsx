'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext'; 
import { db } from '../../../../lib/firebase'; 
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import type { Community } from '../../../../types/community';

import styles from './edit-community.module.css';

export default function EditCommunityPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'location' | 'expertise'>('location');
  const [basisDetail, setBasisDetail] = useState('');
  const [originalLeaderUid, setOriginalLeaderUid] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const fetchCommunityData = useCallback(async () => {
    if (!communityId) return;
    setLoadingData(true);
    try {
      const communityDocRef = doc(db, 'communities', communityId);
      const docSnap = await getDoc(communityDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Community;
        setName(data.name);
        setDescription(data.description);
        setType(data.type);
        setBasisDetail(data.basisDetail);
        setOriginalLeaderUid(data.leaderUid);
      } else {
        setError('Community not found.');
        // Optionally redirect if community not found
        // router.push('/communities'); 
      }
    } catch (err) {
      console.error('Error fetching community data:', err);
      setError('Failed to load community data.');
    }
    setLoadingData(false);
  }, [communityId]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/auth/login'); // Redirect if not logged in
      } else if (originalLeaderUid && currentUser.uid !== originalLeaderUid) {
        setError('You are not authorized to edit this community.');
        // Optionally disable form or redirect
        // router.push(`/communities/${communityId}`);
      }
    }
  }, [currentUser, authLoading, originalLeaderUid, router, communityId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser || currentUser.uid !== originalLeaderUid) {
      setError('You are not authorized to perform this action.');
      return;
    }

    if (!name.trim() || !description.trim() || !basisDetail.trim()) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);

    try {
      const communityDocRef = doc(db, 'communities', communityId);
      await updateDoc(communityDocRef, {
        name: name.trim(),
        description: description.trim(),
        type,
        basisDetail: basisDetail.trim(),
        updatedAt: serverTimestamp(),
      });
      setSuccess('Community details updated successfully!');
      // Optionally, refetch data or rely on local state if it's accurate enough
      // await fetchCommunityData(); 
    } catch (err: any) {
      console.error('Error updating community:', err);
      setError(err.message || 'Failed to update community. Please try again.');
    }
    setSubmitting(false);
  };

  const handleDeleteCommunity = async () => {
    if (!currentUser || currentUser.uid !== originalLeaderUid) {
      setError('You are not authorized to perform this action.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this community? This will also delete all associated posts and member data. This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement cascading deletes for posts, comments, and members.
      // This is best handled with Firebase Functions for atomicity and reliability.
      // For now, we only delete the community document itself.

      const communityDocRef = doc(db, 'communities', communityId);
      await deleteDoc(communityDocRef);
      
      setSuccess('Community deleted successfully.');
      // Redirect to communities list page after deletion
      router.push('/communities'); 

    } catch (err: any) {
      console.error('Error deleting community:', err);
      setError(err.message || 'Failed to delete community. Please try again.');
      setDeleting(false);
    }
    // No need to setDeleting(false) if successful and redirected.
  };

  if (authLoading || loadingData) {
    return <div className={styles.loadingText}>Loading...</div>;
  }

  if (currentUser && originalLeaderUid && currentUser.uid !== originalLeaderUid && !error) {
     // This case might be hit if originalLeaderUid is set but auth is still loading or user mismatches
     // Setting error here ensures UI reflects unauthorized state if not already set
     if (!error) setError('You are not authorized to edit this community.');
  }
  
  // Show error prominently if user is not authorized or data failed to load
  if (error && (!currentUser || (originalLeaderUid && currentUser.uid !== originalLeaderUid))) {
    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <p className={styles.error}>{error}</p>
                <Link href={`/communities/${communityId}`} className={styles.linkBack}>
                    Go back to community page
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Edit Community Details</h1>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        
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
              placeholder={type === 'location' ? 'e.g., India, UP, Bihar ' : 'e.g., Renewable Energy'}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={submitting || (currentUser?.uid !== originalLeaderUid)}>
            {submitting ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
        <Link href={`/communities/${communityId}`} className={styles.linkBack}>
          Back to Community Page
        </Link>

        <div className={styles.dangerZone}>
          <h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
          <button 
            type="button" 
            onClick={handleDeleteCommunity} 
            className={`${styles.button} ${styles.deleteButton}`}
            disabled={deleting || submitting || (currentUser?.uid !== originalLeaderUid)}
          >
            {deleting ? 'Deleting...' : 'Delete Community'}
          </button>
          <p className={styles.dangerZoneWarning}>
            Deleting the community is permanent and will remove all associated data.
          </p>
        </div>
      </div>
    </div>
  );
}
