'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link from next/link
import { useAuth } from '../../../context/AuthContext'; // Adjusted path
import { db } from '../../../lib/firebase'; // Adjusted path
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
  DocumentSnapshot, // Added for explicit typing
  QuerySnapshot,    // Added for explicit typing
  // updateDoc, // For member count, if implemented in Phase 1
  // increment, // For member count, if implemented in Phase 1
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app'; // For typing errors
import styles from './community-detail.module.css';

interface CommunityData {
  id: string;
  name: string;
  description: string;
  type: 'location' | 'expertise';
  basisDetail: string;
  leaderUid: string;
  leaderName: string;
  memberCount: number;
  createdAt: Timestamp;
}

interface PostData {
  id: string;
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
}

interface CommunityMember {
    userId: string;
    communityId: string;
    role: 'leader' | 'member';
    status: 'approved'; // Phase 1 is open joining
    joinedAt: Timestamp;
}

export default function CommunityDetailPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();

  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch community details
  useEffect(() => {
    if (!communityId) return;
    setLoadingCommunity(true);
    const communityDocRef = doc(db, 'communities', communityId);
    const unsubscribe = onSnapshot(communityDocRef, (docSnap: DocumentSnapshot) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<CommunityData, 'id'>;
        setCommunity({ id: docSnap.id, ...data });
        if (currentUser && data.leaderUid === currentUser.uid) {
            setIsLeader(true);
        } else {
            setIsLeader(false); // Explicitly set to false if not leader
        }
      } else {
        setError('Community not found.');
        setCommunity(null);
        setIsLeader(false); // Ensure isLeader is false if community not found
      }
      setLoadingCommunity(false);
    }, (err: FirebaseError) => {
      console.error('Error fetching community:', err);
      setError('Failed to load community details.');
      setLoadingCommunity(false);
      setIsLeader(false); // Ensure isLeader is false on error
    });
    return () => unsubscribe();
  }, [communityId, currentUser]);

  // Fetch community posts
  useEffect(() => {
    if (!communityId) return;
    setLoadingPosts(true);
    const postsCollectionRef = collection(db, 'communityPosts');
    const q = query(
      postsCollectionRef,
      where('communityId', '==', communityId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot) => {
      const fetchedPosts: PostData[] = [];
      querySnapshot.forEach((docSnap: DocumentSnapshot) => {
        fetchedPosts.push({ id: docSnap.id, ...docSnap.data() } as PostData);
      });
      setPosts(fetchedPosts);
      setLoadingPosts(false);
    }, (err: FirebaseError) => {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts.');
      setLoadingPosts(false);
    });
    return () => unsubscribe();
  }, [communityId]);

  // Check membership status
  useEffect(() => {
    if (!currentUser || !communityId || authLoading) {
      setIsMember(false);
      return;
    }
    const memberDocRef = doc(db, 'communityMembers', `${communityId}_${currentUser.uid}`);
    const unsubscribe = onSnapshot(memberDocRef, (docSnap: DocumentSnapshot) => {
        setIsMember(docSnap.exists() && docSnap.data()?.status === 'approved');
    });
    return () => unsubscribe();
  }, [currentUser, communityId, authLoading]);


  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to post.');
      router.push('/auth/login');
      return;
    }
    if (!isMember && !isLeader) {
        setError('You must be a member to post in this community.');
        return;
    }
    if (!newPostContent.trim()) {
      setError('Post content cannot be empty.');
      return;
    }
    setActionInProgress(true);
    setError('');
    try {
      if (!currentUser || !currentUser.displayName) {
        setError('User information is not available. Cannot post.');
        setActionInProgress(false);
        return;
      }
      await addDoc(collection(db, 'communityPosts'), {
        communityId,
        authorUid: currentUser.uid,
        authorDisplayName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || '',
        content: newPostContent.trim(),
        createdAt: serverTimestamp(),
        likesCount: 0, // As per APP_PLAN for communityPosts
        commentsCount: 0 // As per APP_PLAN for communityPosts
      });
      setNewPostContent('');
    } catch (err) {
    console.error('Error creating post:', err);
    if (err instanceof FirebaseError) {
      setError(`Firebase error: ${err.message} (Code: ${err.code})`);
    } else if (err instanceof Error) {
      setError(`Error: ${err.message}`);
    } else {
      setError('An unexpected error occurred while posting. Please try again.');
    }
  } 
    setActionInProgress(false);
  };

  const handleJoinCommunity = async () => {
    if (!currentUser) {
      setError('You must be logged in to join.');
      router.push('/auth/login');
      return;
    }
    if (isMember || isLeader) return;

    setActionInProgress(true);
    setError('');
    try {
      const memberDocRef = doc(db, 'communityMembers', `${communityId}_${currentUser.uid}`);
      await setDoc(memberDocRef, {
        communityId,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous',
        userPhotoURL: currentUser.photoURL || '',
        role: 'member',
        status: 'approved', // Phase 1: Open joining
        joinedAt: serverTimestamp(),
        requestedAt: serverTimestamp() // For open joining, joinedAt and requestedAt can be same
      });
      // Optionally, update member count on community document (or use Cloud Function later)
      // const communityDocRef = doc(db, 'communities', communityId);
      // await updateDoc(communityDocRef, { memberCount: increment(1) });
      setIsMember(true); // Update UI immediately
    } catch (err) {
    console.error('Error joining community:', err);
    if (err instanceof FirebaseError) {
      setError(`Firebase error: ${err.message} (Code: ${err.code})`);
    } else if (err instanceof Error) {
      setError(`Error: ${err.message}`);
    } else {
      setError('An unexpected error occurred while joining. Please try again.');
    }
  } 
    setActionInProgress(false);
  };

  if (loadingCommunity || authLoading) {
    return <div className={styles.loadingContainer}>Loading community...</div>;
  }

  if (error && !community) { // Show error if community fetch failed and no community data
    return <div className={styles.errorContainer}>{error}</div>;
  }

  if (!community) {
    return <div className={styles.errorContainer}>Community not found.</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.name}>{community.name}</h1>
        <p className={styles.metaInfo}>
          <span>Type: <strong>{community.type}</strong></span>
          <span>Basis: <strong>{community.basisDetail}</strong></span>
        </p>
        <p className={styles.leaderInfo}>Leader: <strong>{community.leaderName}</strong></p>
        <p className={styles.metaInfo}>Members: <strong>{community.memberCount}</strong></p>
        {currentUser && !isLeader && !isMember && (
          <button onClick={handleJoinCommunity} className={styles.joinButton} disabled={actionInProgress}>
            {actionInProgress ? 'Joining...' : 'Join Community'}
          </button>
        )}
        {currentUser && (isMember || isLeader) && <p className={styles.alreadyMemberText}>You are a {isLeader ? 'leader' : 'member'} of this community.</p>}
        {isLeader && (
          <Link href={`/communities/${communityId}/edit`} className={styles.editCommunityButton}>
            Edit Community
          </Link>
        )}
      </header>

      <section className={styles.descriptionSection}>
        <h2 className={styles.sectionTitle}>About this Community</h2>
        <p className={styles.description}>{community.description}</p>
      </section>

      <section className={styles.discussionSection}>
        <h2 className={styles.sectionTitle}>Community Discussion</h2>
        {currentUser && (isMember || isLeader) ? (
          <form onSubmit={handlePostSubmit} className={styles.discussionForm}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your thoughts with the community..."
              rows={4}
              required
              disabled={actionInProgress}
            />
            <button type="submit" disabled={actionInProgress || !newPostContent.trim()}>
              {actionInProgress ? 'Posting...' : 'Post'}
            </button>
          </form>
        ) : currentUser ? (
            <p>You must join this community to post.</p>
        ) : (
          <p>Please <Link href="/auth/login" style={{color: '#007bff', textDecoration: 'underline'}}>login</Link> to post or join the community.</p>
        )}


        {error && !community && <p className={styles.errorContainer}>{error}</p>} {/* Display general errors here if needed */}
        
        {loadingPosts ? (
          <p>Loading posts...</p>
        ) : posts.length > 0 ? (
          <ul className={styles.postList}>
            {posts.map((post) => (
              <li key={post.id} className={styles.postItem}>
                <div className={styles.postAuthor}>{post.authorDisplayName}</div>
                <p className={styles.postContent}>{post.content}</p>
                <div className={styles.postTimestamp}>
                  {post.createdAt?.toDate().toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noPosts}>No posts in this community yet. Be the first to share!</p>
        )}
      </section>
    </div>
  );
}

