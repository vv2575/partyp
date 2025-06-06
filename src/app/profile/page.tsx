'use client';

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css';
import type { UserProfile } from '../../types/profile';
import type { Community } from '../../types/community';
// import { updateProfile as firebaseUpdateProfile } from 'firebase/auth'; // Not used directly if updating Firestore

const ProfilePage = () => {
  const { currentUser, loading: authLoading } = useAuth(); // Changed user to currentUser
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({ displayName: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedCommunitiesDetails, setJoinedCommunitiesDetails] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const fetchedProfile = { uid: currentUser.uid, ...userDocSnap.data() } as UserProfile;
          setProfile(fetchedProfile);
          setFormData({
            displayName: fetchedProfile.displayName || '',
            bio: fetchedProfile.bio || '',
            // Ensure other fields from UserProfile are not accidentally overwritten if they were part of formData
          });
        } else {
          const newProfileData: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL || null,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            bio: '',
            createdAt: Timestamp.now(),
          };
          await setDoc(userDocRef, newProfileData);
          setProfile(newProfileData);
          setFormData({
            displayName: newProfileData.displayName || '',
            bio: newProfileData.bio || '',
            // Ensure other fields from UserProfile are not accidentally overwritten if they were part of formData
          });
        }
      } catch (err) {
        console.error('Error fetching/creating profile:', err);
        setError('Failed to load profile.');
      }
      setLoading(false);
    };

    const fetchJoinedCommunities = async (userId: string) => {
      setCommunitiesLoading(true);
      try {
        const communityMembersRef = collection(db, 'communityMembers');
        const q = query(communityMembersRef, where('userId', '==', userId), where('status', '==', 'approved'));
        const memberSnapshots = await getDocs(q);
        
        const communityIds = memberSnapshots.docs.map(doc => doc.data().communityId as string);
        
        if (communityIds.length > 0) {
          const communitiesData: Community[] = [];
          // Fetch details for each community
          // This can be optimized with a single 'in' query if communityIds.length <= 30
          // For simplicity now, fetching one by one. Consider batching for performance.
          for (const communityId of communityIds) {
            const communityDocRef = doc(db, 'communities', communityId);
            const communityDocSnap = await getDoc(communityDocRef);
            if (communityDocSnap.exists()) {
              communitiesData.push({ communityId: communityDocSnap.id, ...communityDocSnap.data() } as Community);
            }
          }
          setJoinedCommunitiesDetails(communitiesData);
        }
      } catch (err) {
        console.error('Error fetching joined communities:', err);
        // Set a specific error state for communities if needed
      }
      setCommunitiesLoading(false);
    };

    if (currentUser) {
      fetchProfile().then(() => {
        fetchJoinedCommunities(currentUser.uid);
      });
    } else if (!authLoading) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatedProfileData: UserProfile = {
        ...(profile as UserProfile), // Assert profile is UserProfile, as it's checked before
        displayName: formData.displayName || null, 
        bio: formData.bio || '', // Ensure bio is at least an empty string if undefined
        updatedAt: Timestamp.now(),
      };
      // Ensure we only pass fields defined in UserProfile, if formData has extra ones
      // For this specific case, updatedProfileData is already structured correctly.
      await setDoc(userDocRef, updatedProfileData, { merge: true }); // merge:true is good practice
      setProfile(updatedProfileData); // Update local profile state
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile.');
      alert('Error saving profile. Please try again.');
    }
    setLoading(false);
  };

  if (loading || authLoading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!profile) {
    return <div className={styles.error}>Profile not found. Please try logging in again.</div>;
  }

  return (
    <div className={styles.profilePageContainer}>
      <div className={styles.profileCard}>
        <h1 className={styles.profileHeader}>{isEditing ? 'Edit Profile' : 'User Profile'}</h1>
        
        {isEditing ? (
          <form onSubmit={handleSaveProfile}>
            <div className={styles.formGroup}>
              <label htmlFor="displayName">Display Name:</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email || ''}
                disabled
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="bio">Bio:</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.saveButton} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className={styles.cancelButton} onClick={() => setIsEditing(false)} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className={styles.profileDetail}>
              <strong>Display Name:</strong> <span>{profile.displayName || 'Not set'}</span>
            </div>
            <div className={styles.profileDetail}>
              <strong>Email:</strong> <span>{profile.email}</span>
            </div>
            <div className={styles.profileDetail}>
              <strong>Bio:</strong> <span>{profile.bio || 'No bio set.'}</span>
            </div>
            <div className={styles.editButtonContainer}>
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                Edit Profile
              </button>
            </div>
          </>
        )}
      </div>

      {/* Joined Communities Section */}
      <div className={styles.joinedCommunitiesSection}>
        <h2 className={styles.sectionTitle}>Joined Communities</h2>
        {communitiesLoading ? (
          <p className={styles.loadingText}>Loading communities...</p>
        ) : joinedCommunitiesDetails.length > 0 ? (
          <ul className={styles.communitiesList}>
            {joinedCommunitiesDetails.map(community => (
              <li key={community.communityId} className={styles.communityItem}>
                <div className={styles.communityInfo}>
                  <strong className={styles.communityName}>{community.name}</strong>
                  {community.allianceName && (
                    <span className={styles.allianceName}> (Alliance: {community.allianceName})</span>
                  )}
                </div>
                <Link href={`/communities/${community.communityId}`} className={styles.viewCommunityLink}>View Community</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noCommunitiesText}>You haven't joined any communities yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;