'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext'; // Adjusted path
import { db } from '../../../../lib/firebase'; // Adjusted path
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
  DocumentData,
  deleteDoc, // For rejecting by deleting
} from 'firebase/firestore';
import styles from './manage-members.module.css';
import Link from 'next/link';
import type { Community, CommunityMember } from '../../../../types/community'; // Import centralized types

export default function ManageMembersPage() {
  const params = useParams();
  const communityIdFromParams = params.communityId as string; // Renamed to avoid conflict with Community.communityId
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [pendingMembers, setPendingMembers] = useState<CommunityMember[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch community details to verify leader
  useEffect(() => {
    if (!communityIdFromParams || !currentUser) {
        if (!currentUser && !authLoading) setError('You must be logged in to manage members.');
        else if(!communityIdFromParams) setError('Community ID not found.');
        setIsLoading(false);
        return;
    }
    const communityDocRef = doc(db, 'communities', communityIdFromParams);
    getDocs(query(collection(db, 'communities'), where('__name__', '==', communityIdFromParams)))
      .then((snapshot) => {
        if (!snapshot.empty) {
          const communityData = snapshot.docs[0].data() as Omit<Community, 'communityId'>;
          setCommunity({ communityId: snapshot.docs[0].id, ...communityData });
          if (communityData.leaderUid !== currentUser.uid) {
            setError('Access Denied: You are not the leader of this community.');
          }
        } else {
          setError('Community not found.');
        }
      })
      .catch((err) => {
        console.error('Error fetching community details:', err);
        setError('Failed to load community details.');
      })
      // .finally(() => setIsLoading(false)); // Moved loading state update to the end of member fetch
  }, [communityIdFromParams, currentUser, router, authLoading]);

  // Fetch pending and approved members
  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve

    if (!currentUser || !community || community.leaderUid !== currentUser.uid) {
      if (community && currentUser && community.leaderUid !== currentUser.uid && !error) {
         setError('Access Denied: You are not the leader of this community.');
      } else if (!currentUser && !error){
        // setError('Please log in to manage members.'); // Already handled by first effect potentially
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const membersCollectionRef = collection(db, 'communityMembers');
    const q = query(
      membersCollectionRef,
      where('communityId', '==', communityIdFromParams),
      where('status', 'in', ['pending', 'approved']) // Fetch both pending and approved
    );

    getDocs(q)
      .then((querySnapshot) => {
        const pending: CommunityMember[] = [];
        const approved: CommunityMember[] = [];
        querySnapshot.forEach((docSnap) => {
          // Assuming docSnap.id is the membershipId (e.g., userId_communityId)
          const memberData = { membershipId: docSnap.id, ...(docSnap.data() as Omit<CommunityMember, 'membershipId'>) } as CommunityMember;
          if (memberData.status === 'pending') {
            pending.push(memberData);
          } else if (memberData.status === 'approved') {
            if (memberData.userId !== community?.leaderUid) {
                approved.push(memberData);
            }
          }
        });
        setPendingMembers(pending);
        setApprovedMembers(approved);
        setError(''); // Clear previous errors if successful
      })
      .catch((err) => {
        console.error('Error fetching pending members:', err);
        setError('Failed to load membership data.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [communityIdFromParams, currentUser, community, authLoading, error]);

  const handleApprove = async (memberDocId: string, userIdToApprove: string) => {
    if (!communityIdFromParams) return;
    setActionInProgress(memberDocId);
    try {
      const memberDocRef = doc(db, 'communityMembers', memberDocId);
      await updateDoc(memberDocRef, {
        status: 'approved',
        role: 'member', // Keep role as member upon approval
        joinedAt: serverTimestamp(), // Set joinedAt upon approval
      });

      const communityDocRef = doc(db, 'communities', communityIdFromParams);
      await updateDoc(communityDocRef, {
        memberCount: increment(1),
      });

      // Update local state: move from pending to approved
      const memberToMove = pendingMembers.find(m => m.membershipId === memberDocId);
      if (memberToMove) {
        setPendingMembers((prev) => prev.filter((member) => member.membershipId !== memberDocId));
        // Ensure the moved member has the updated status and joinedAt for approvedMembers list
        // For simplicity, we rely on a re-fetch or assume the component will re-render with updated data
        // Or, explicitly add to approvedMembers if not relying on full re-fetch for this list
        const updatedMember = { ...memberToMove, status: 'approved', joinedAt: Timestamp.now() } as CommunityMember;
        if (updatedMember.userId !== community?.leaderUid) { // Add to approved list if not leader
            setApprovedMembers(prev => [...prev, updatedMember]);
        }
      }
      setError('');
    } catch (err) {
      console.error('Error approving member:', err);
      setError('Failed to approve member. Please try again.');
    }
    setActionInProgress(null);
  };

  const handleReject = async (memberDocId: string) => {
    setActionInProgress(memberDocId);
    try {
      const memberDocRef = doc(db, 'communityMembers', memberDocId);
      await updateDoc(memberDocRef, {
        status: 'rejected',
      });
      // Or delete: await deleteDoc(memberDocRef);
      setPendingMembers((prev) => prev.filter((member) => member.membershipId !== memberDocId));
      setError('');
    } catch (err) {
      console.error('Error rejecting member:', err);
      setError('Failed to reject member. Please try again.');
    }
    setActionInProgress(null);
  };

  const handleRemoveMember = async (memberDocId: string) => {
    if (!communityIdFromParams) return;
    setActionInProgress(memberDocId);
    try {
      const memberDocRef = doc(db, 'communityMembers', memberDocId);
      // Instead of 'removed', the type expects 'banned' or deletion.
      // For a non-destructive 'remove' that allows re-joining, 'rejected' might be an option, or a new status.
      // Let's assume 'rejected' means they can re-apply, or we can delete the record.
      // If we want a 'banned' status, the UI should reflect that. For now, let's use 'rejected' to signify removal from approved.
      // Or, more simply, delete the membership document.
      await deleteDoc(memberDocRef);

      const communityDocRef = doc(db, 'communities', communityIdFromParams);
      await updateDoc(communityDocRef, {
        memberCount: increment(-1),
      });

      setApprovedMembers((prev) => prev.filter((member) => member.membershipId !== memberDocId));
      setError('');
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member. Please try again.');
    }
    setActionInProgress(null);
  };

  if (authLoading) {
    return <div className={styles.loadingContainer}>Authenticating...</div>;
  }

  // Early exit if user is not logged in after auth check
  if (!currentUser) {
    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Manage Community Members</h1>
            <p className={styles.errorContainer}>Please log in to manage community members.</p>
            <Link href={`/auth/login?redirect=/communities/${communityIdFromParams}/manage-members`} className={styles.backLink}>Login</Link>
            <br />
            <Link href={`/communities/${communityIdFromParams}`} className={styles.backLink} style={{marginTop: '1rem'}}>Back to Community</Link>
        </div>
    );
  }
  
  // Loading state for community data or initial member fetch
  if (isLoading && !error) { // Show loading if actively loading and no overriding error
    return <div className={styles.loadingContainer}>Loading member requests...</div>;
  }

  // If there's an error message, and it's an access denial or community not found
  if (error && (error.startsWith('Access Denied') || error.startsWith('Community not found') || error.startsWith('Failed to load community details'))) {
    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Manage Community Members</h1>
            <p className={styles.errorContainer}>{error}</p>
            <Link href={`/communities/${communityIdFromParams}`} className={styles.backLink}>Back to Community</Link>
        </div>
    );
  }
  
  // If community data is loaded but user is not the leader (double check after initial effect)
  if (community && community.leaderUid !== currentUser.uid) {
    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Manage Community Members</h1>
            <p className={styles.errorContainer}>Access Denied: You are not the leader of this community.</p>
            <Link href={`/communities/${communityIdFromParams}`} className={styles.backLink}>Back to Community</Link>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Manage Join Requests for {community?.name || 'Community'}</h1>
      
      {error && !error.startsWith('Access Denied') && !error.startsWith('Community not found') && <p className={styles.errorContainer}>{error}</p>}

      {isLoading && <p>Loading requests...</p>} 

      {!isLoading && pendingMembers.length === 0 && !error && (
        <p>No pending join requests at the moment.</p>
      )}

      {!isLoading && pendingMembers.length > 0 && (
        <ul className={styles.requestList}>
          {pendingMembers.map((member) => (
            <li key={member.membershipId} className={styles.requestItem}>
              <span className={styles.memberName}>
                {member.userDisplayName || member.userId} 
              </span>
              <div className={styles.actions}>
                <button 
                  onClick={() => handleApprove(member.membershipId, member.userId)}
                  disabled={actionInProgress === member.membershipId}
                  className={`${styles.button} ${styles.approveButton}`}
                >
                  {actionInProgress === member.membershipId ? 'Approving...' : 'Approve'}
                </button>
                <button 
                  onClick={() => handleReject(member.membershipId)}
                  disabled={actionInProgress === member.membershipId}
                  className={`${styles.button} ${styles.rejectButton}`}
                >
                  {actionInProgress === member.membershipId ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/communities/${communityIdFromParams}`} className={styles.backLink}>Back to Community</Link>

      <h2 className={styles.subHeading}>Approved Members ({approvedMembers.length})</h2>
      {!isLoading && approvedMembers.length === 0 && !error && (
        <p>No other approved members in this community yet.</p>
      )}
      {!isLoading && approvedMembers.length > 0 && (
        <ul className={styles.memberList}>
          {approvedMembers.map((member) => (
            <li key={member.membershipId} className={styles.memberItem}>
              <span className={styles.memberName}>
                {member.userDisplayName || member.userId}
              </span>
              <div className={styles.actions}>
                {member.userId !== community?.leaderUid && ( // Should already be filtered, but double check
                  <button 
                    onClick={() => handleRemoveMember(member.membershipId)}
                    disabled={actionInProgress === member.membershipId}
                    className={`${styles.button} ${styles.removeButton}`}>
                    {actionInProgress === member.membershipId ? 'Removing...' : 'Remove Member'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
