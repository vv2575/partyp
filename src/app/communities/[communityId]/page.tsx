'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  Timestamp,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  setDoc,
  DocumentSnapshot,
  QuerySnapshot,
  orderBy
} from 'firebase/firestore';
import { FirebaseError } from '@firebase/app';
import styles from './community-detail.module.css';
import type { Community, CommunityPost, CommunityPostComment, CommunityMember } from '../../../types/community';

const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 inline-block mr-1"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 inline-block mr-1"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 inline-block mr-1"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 inline-block mr-1"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;

export default function CommunityDetailPage() {
  const params = useParams();
  const communityId = params.communityId as string;
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [comments, setComments] = useState<{ [postId: string]: CommunityPostComment[] }>({});
  const [newCommentContent, setNewCommentContent] = useState<{ [postId: string]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
  const [visibleComments, setVisibleComments] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [joinStatus, setJoinStatus] = useState<'pending' | 'approved' | 'rejected' | 'banned' | null>(null);
  const [isLeader, setIsLeader] = useState(false);

  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchComments = useCallback(async (postId: string) => {
    if (loadingComments[postId] || (comments[postId] && comments[postId].length > 0 && visibleComments === postId)) {
      return;
    }
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const commentsCollectionRef = collection(db, 'postComments');
      const q = query(
        commentsCollectionRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedComments: CommunityPostComment[] = [];
      querySnapshot.forEach((docSnap: DocumentSnapshot) => {
        fetchedComments.push({ commentId: docSnap.id, ...(docSnap.data() as Omit<CommunityPostComment, 'commentId'>) } as CommunityPostComment);
      });
      setComments(prev => ({ ...prev, [postId]: fetchedComments }));
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  }, [loadingComments, comments, visibleComments]);

  const toggleCommentsVisibility = useCallback((postId: string) => {
    setVisibleComments(prevVisible => {
      if (prevVisible === postId) {
        return null; // Hide if already visible
      } else {
        // Show this post's comments
        if (!comments[postId] || comments[postId].length === 0) { // Fetch only if not already fetched or empty
          fetchComments(postId);
        }
        return postId;
      }
    });
  }, [comments, fetchComments]);

  const handleNewCommentChange = (postId: string, text: string) => {
    setNewCommentContent(prev => ({ ...prev, [postId]: text }));
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>, postId: string) => {
    e.preventDefault();
    if (!currentUser || !newCommentContent[postId]?.trim()) return;
    setActionInProgress(true);
    try {
      const commentDataToSubmit = {
        postId: postId,
        communityId: communityId,
        authorUid: currentUser.uid,
        authorDisplayName: currentUser.displayName || 'Anonymous User',
        authorPhotoURL: currentUser.photoURL || '',
        content: newCommentContent[postId],
        createdAt: serverTimestamp(),
        likesCount: 0,
      };
      const commentDocRef = await addDoc(collection(db, 'postComments'), commentDataToSubmit);
      const newComment: CommunityPostComment = {
        commentId: commentDocRef.id,
        ...commentDataToSubmit,
        createdAt: Timestamp.now(), // Use client-side timestamp for immediate UI update
      };
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setNewCommentContent(prev => ({ ...prev, [postId]: '' }));
      const postDocRef = doc(db, 'communityPosts', postId);
      await updateDoc(postDocRef, { commentsCount: increment(1) });
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment.');
    } finally {
      setActionInProgress(false);
    }
  };

  useEffect(() => {
    if (!communityId) return;
    setLoadingCommunity(true);
    const communityDocRef = doc(db, 'communities', communityId);
    const unsubscribe = onSnapshot(communityDocRef, (docSnap: DocumentSnapshot) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Community, 'communityId'>;
        setCommunity({ communityId: docSnap.id, ...data } as Community);
        setIsLeader(!!(currentUser && data.leaderUid === currentUser.uid));
      } else {
        setError('Community not found.');
        setCommunity(null);
        setIsLeader(false);
      }
      setLoadingCommunity(false);
    }, (err: FirebaseError) => {
      console.error('Error fetching community:', err);
      setError('Failed to load community details.');
      setLoadingCommunity(false);
      setIsLeader(false);
    });
    return () => unsubscribe();
  }, [communityId, currentUser]);

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
      const fetchedPosts: CommunityPost[] = [];
      querySnapshot.forEach((docSnap: DocumentSnapshot) => {
        fetchedPosts.push({ postId: docSnap.id, ...(docSnap.data() as Omit<CommunityPost, 'postId'>) } as CommunityPost);
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

  useEffect(() => {
    if (!currentUser || !communityId || authLoading) {
      setJoinStatus(null);
      setIsMember(false);
      return;
    }
    const memberDocRef = doc(db, 'communities', communityId, 'members', currentUser.uid);
    const unsubscribe = onSnapshot(memberDocRef, (docSnap: DocumentSnapshot) => {
      if (docSnap.exists()) {
        const memberData = docSnap.data() as CommunityMember;
        setJoinStatus(memberData.status as 'pending' | 'approved' | 'rejected' | 'banned');
        setIsMember(memberData.status === 'approved');
      } else {
        setJoinStatus(null);
        setIsMember(false);
      }
    }, (err: FirebaseError) => {
      console.error('Error fetching membership status:', err);
      setJoinStatus(null);
      setIsMember(false);
    });
    return () => unsubscribe();
  }, [communityId, currentUser, authLoading]);

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !newPostContent.trim()) {
      setError('You must be logged in and provide content to post.');
      return;
    }
    if (!isMember && !isLeader) {
      setError('You must be a member of this community to post.');
      return;
    }
    setActionInProgress(true);
    setError('');
    try {
      const postDataToSubmit = {
        communityId: communityId,
        authorUid: currentUser.uid,
        authorDisplayName: currentUser.displayName || 'Anonymous User',
        authorPhotoURL: currentUser.photoURL || '',
        content: newPostContent,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
      };
      await addDoc(collection(db, 'communityPosts'), postDataToSubmit);
      setNewPostContent('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(`Failed to create post: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    if (!community) return;
    setActionInProgress(true);
    setError('');
    try {
      const memberDocRef = doc(db, 'communities', communityId, 'members', currentUser.uid);
      const memberData: CommunityMember = {
        membershipId: currentUser.uid, // Assuming doc ID is membershipId
        communityId: communityId,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous User',
        userPhotoURL: currentUser.photoURL || '',
        role: 'member',
        status: community.requiresApproval ? 'pending' : 'approved',
        joinedAt: serverTimestamp() as unknown as Timestamp, // Cast to satisfy local type
        requestedAt: serverTimestamp() as unknown as Timestamp, // Add required field and cast
      };
      await setDoc(memberDocRef, memberData);
      if (memberData.status === 'approved') {
        const communityDocRef = doc(db, 'communities', communityId);
        await updateDoc(communityDocRef, { memberCount: increment(1) });
      }
    } catch (err) {
      console.error('Error joining community:', err);
      setError(`Failed to join community: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionInProgress(false);
    }
  };

  if (authLoading || loadingCommunity) {
    return <div className={styles.loadingScreen}><div className={styles.spinner}></div>Loading community details...</div>;
  }

  if (!community) {
    return <div className={styles.errorScreen}>{error || 'Community not found or failed to load.'}</div>;
  }

  const renderActionButtons = () => {
    if (!currentUser) {
      return (
        <Link href="/auth/login" className={`${styles.button} ${styles.buttonPrimary}`}>
          <IconPlusCircle /> Login to Interact
        </Link>
      );
    }
    if (isLeader) {
      return (
        <div className={styles.actionButtonsGroup}>
          <p className={styles.statusMessage}>You are the commander of this community.</p>
          <Link href={`/communities/${communityId}/edit`} className={`${styles.button} ${styles.buttonSecondary}`}>
            <IconEdit /> Edit Community
          </Link>
          <Link href={`/communities/${communityId}/manage-members`} className={`${styles.button} ${styles.buttonSecondary}`}>
            <IconUsers /> Manage Members
          </Link>
        </div>
      );
    }
    if (isMember) {
      return (
        <div className={styles.actionButtonsGroup}>
          <p className={styles.statusMessage}>You are a member of this community.</p>
          {community.allowStormIn && (
            <button onClick={() => alert('Feature: Request to Storm In - Not yet implemented.')} className={`${styles.button} ${styles.buttonAccent}`} disabled={actionInProgress}>
              Request to Storm In
            </button>
          )}
        </div>
      );
    }
    if (joinStatus === 'pending') {
      return <p className={`${styles.statusMessage} ${styles.statusPending}`}>Your request to join is pending approval.</p>;
    }
    if (joinStatus === 'rejected') {
      return <p className={`${styles.statusMessage} ${styles.statusError}`}>Your request to join was rejected.</p>;
    }
    if (joinStatus === 'banned') {
      return <p className={`${styles.statusMessage} ${styles.statusError}`}>You are banned from this community.</p>;
    }
    return (
      <button onClick={handleJoinCommunity} className={`${styles.button} ${styles.buttonPrimary}`} disabled={actionInProgress}>
        <IconPlusCircle /> {actionInProgress ? 'Joining...' : 'Join Community'}
      </button>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <header className={`${styles.communityHeaderCard} ${styles.card}`}>
        <h1 className={styles.communityName}>{community.name}</h1>
        <div className={styles.communityMetaContainer}>
          <p className={styles.communityMetaItem}><strong>Type:</strong> {community.type}</p>
          <p className={styles.communityMetaItem}><strong>Basis:</strong> {community.basisDetail}</p>
          <p className={styles.communityMetaItem}><strong>Leader:</strong> {community.leaderName || 'N/A'}</p>
          <p className={styles.communityMetaItem}><IconUsers /> <strong>Warriors:</strong> {community.memberCount || 0}</p>
        </div>
      </header>

      <section className={styles.actionsContainer}>
        {renderActionButtons()}
      </section>

      {community.description && (
        <section className={`${styles.aboutSection} ${styles.card}`}>
          <h2 className={styles.sectionTitle}><IconInfo /> About this Community</h2>
          <p className={styles.communityDescription}>{community.description}</p>
        </section>
      )}

      <section className={`${styles.discussionSection} ${styles.card}`}>
        <h2 className={styles.sectionTitle}>Community Discussion</h2>

        {currentUser && (isMember || isLeader) ? (
          <form onSubmit={handlePostSubmit} className={styles.newPostForm}>
            <textarea
              className={styles.formTextarea}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your thoughts with the community..."
              rows={4}
              required
              disabled={actionInProgress}
            />
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={actionInProgress || !newPostContent.trim()}>
              {actionInProgress ? 'Posting...' : 'Post to Community'}
            </button>
          </form>
        ) : currentUser ? (
          <p className={styles.infoMessage}>You must be a member of this community to post.</p>
        ) : (
          <p className={styles.infoMessage}>Please <Link href="/auth/login" className={styles.inlineLink}>login</Link> to post or join the community.</p>
        )}

        {error && <p className={styles.errorMessage}>{error}</p>}

        {loadingPosts ? (
          <div className={styles.loadingMessage}><div className={styles.spinner}></div>Loading posts...</div>
        ) : posts.length > 0 ? (
          <ul className={styles.postList}>
            {posts.map((post) => (
              <li key={post.postId} className={`${styles.postItem} ${styles.cardItem}`}>
                <div className={styles.postAuthorInfo}>
                  {post.authorPhotoURL ? (
                    <img src={post.authorPhotoURL} alt={post.authorDisplayName} className={styles.authorAvatar} />
                  ) : (
                    <div className={`${styles.authorAvatar} ${styles.authorAvatarPlaceholder}`}><span>{post.authorDisplayName?.charAt(0).toUpperCase()}</span></div>
                  )}
                  <span className={styles.authorName}>{post.authorDisplayName}</span>
                </div>
                <p className={styles.postContent}>{post.content}</p>
                <div className={styles.postMeta}>
                  <span className={styles.timestamp}>{post.createdAt?.toDate().toLocaleString()}</span>
                  <button
                    onClick={() => toggleCommentsVisibility(post.postId)}
                    className={`${styles.button} ${styles.buttonLink}`}
                    disabled={loadingComments[post.postId]}
                  >
                    {loadingComments[post.postId] ? '...' : (visibleComments === post.postId ? 'Hide Comments' : `View Comments (${post.commentsCount || 0})`)}
                  </button>
                </div>

                {visibleComments === post.postId && (
                  <div className={styles.commentsArea}>
                    {loadingComments[post.postId] && <div className={styles.loadingMessage}><div className={styles.spinnerSmall}></div>Loading comments...</div>}
                    {!loadingComments[post.postId] && comments[post.postId] && comments[post.postId].length > 0 ? (
                      <ul className={styles.commentList}>
                        {comments[post.postId].map(comment => (
                          <li key={comment.commentId} className={styles.commentItem}>
                            <div className={styles.commentAuthorInfo}>
                              {comment.authorPhotoURL ? (
                                <img src={comment.authorPhotoURL} alt={comment.authorDisplayName} className={styles.authorAvatarSmall} />
                              ) : (
                                <div className={`${styles.authorAvatarSmall} ${styles.authorAvatarPlaceholder}`}><span>{comment.authorDisplayName?.charAt(0).toUpperCase()}</span></div>
                              )}
                              <span className={styles.authorNameSmall}>{comment.authorDisplayName}</span>
                            </div>
                            <p className={styles.commentContent}>{comment.content}</p>
                            <span className={styles.timestampSmall}>{comment.createdAt?.toDate().toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : !loadingComments[post.postId] && (
                      <p className={styles.noCommentsMessage}>No comments yet. Be the first to comment!</p>
                    )}

                    {currentUser && (isMember || isLeader) && (
                      <form onSubmit={(e) => handleCommentSubmit(e, post.postId)} className={styles.newCommentForm}>
                        <textarea
                          className={styles.formTextareaSmall}
                          value={newCommentContent[post.postId] || ''}
                          onChange={(e) => handleNewCommentChange(post.postId, e.target.value)}
                          placeholder="Write a comment..."
                          rows={2}
                          required
                          disabled={actionInProgress}
                        />
                        <button type="submit" className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`} disabled={actionInProgress || !newCommentContent[post.postId]?.trim()}>
                          {actionInProgress ? '...' : 'Post Comment'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          !loadingPosts && <p className={styles.noPostsMessage}>No posts in this community yet. Be the first to share!</p>
        )}
      </section>
    </div>
  );
}
