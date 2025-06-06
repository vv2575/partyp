import { db } from '../lib/firebase';
import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, runTransaction, writeBatch, serverTimestamp,
  onSnapshot, orderBy
} from 'firebase/firestore';
import type { Alliance, AllianceMember, AlliancePost, AlliancePostComment } from '../types/alliance';
import type { User } from '../types/user';
import type { Community } from '../types/community';

const alliancesCollection = collection(db, 'alliances');
const allianceMembersCollection = collection(db, 'allianceMembers');
const alliancePostsCollection = collection(db, 'alliancePosts');

// --- Alliance Management --- 

export const createAlliance = async (allianceData: Omit<Alliance, 'allianceId' | 'createdAt' | 'updatedAt' | 'memberCommunityCount'>, creator: User, initialCommunity: Community): Promise<string | null> => {
  if (!creator.ledCommunityIds?.includes(initialCommunity.communityId)) {
    console.error('Creator must be the leader of the initial community.');
    throw new Error('Creator must be the leader of the initial community.');
  }

  try {
    const newAllianceRef = doc(alliancesCollection); // Generate ID upfront
    const allianceId = newAllianceRef.id;

    const batch = writeBatch(db);

    // 1. Create Alliance Document
    batch.set(newAllianceRef, {
      ...allianceData,
      allianceId: allianceId,
      memberCommunityCount: 1, // Starts with the creator's community
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Add Creator's Community to AllianceMembers
    const allianceMemberRef = doc(allianceMembersCollection, `${allianceId}_${initialCommunity.communityId}`);
    batch.set(allianceMemberRef, {
      allianceId: allianceId,
      communityId: initialCommunity.communityId,
      communityName: initialCommunity.name,
      communityLeaderUid: creator.uid,
      joinedAt: serverTimestamp(),
    });

    // 3. Update Community with Alliance Info
    const communityRef = doc(db, 'communities', initialCommunity.communityId);
    batch.update(communityRef, {
      allianceId: allianceId,
      allianceName: allianceData.name,
    });

    // 4. Update User's createdAllianceIds
    const userRef = doc(db, 'users', creator.uid);
    batch.update(userRef, {
        createdAllianceIds: [...(creator.createdAllianceIds || []), allianceId]
    });

    await batch.commit();
    return allianceId;
  } catch (error) {
    console.error('Error creating alliance:', error);
    return null;
  }
};

export const getAllianceById = async (allianceId: string): Promise<Alliance | null> => {
  try {
    const docRef = doc(db, 'alliances', allianceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { allianceId: docSnap.id, ...docSnap.data() } as Alliance;
    }
    return null;
  } catch (error) {
    console.error('Error fetching alliance:', error);
    return null;
  }
};

export const getAllAlliances = async (): Promise<Alliance[]> => {
  try {
    const snapshot = await getDocs(alliancesCollection);
    return snapshot.docs.map(doc => ({ allianceId: doc.id, ...doc.data() } as Alliance));
  } catch (error) {
    console.error('Error fetching all alliances:', error);
    return [];
  }
};

export const updateAllianceDetails = async (allianceId: string, updates: Partial<Omit<Alliance, 'allianceId' | 'createdAt' | 'updatedAt' | 'memberCommunityCount'>>) => {
  try {
    const allianceRef = doc(db, 'alliances', allianceId);
    await updateDoc(allianceRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating alliance details:', error);
    return false;
  }
};

// --- Alliance Membership --- 

export const requestToJoinAlliance = async (allianceId: string, communityId: string, communityName: string, communityLeaderUid: string): Promise<boolean> => {
  // In a real app, this might create a 'pending' status or send a notification
  // For now, we'll directly add the community for simplicity as per Phase 3 basic workflow.
  try {
    const allianceRef = doc(db, 'alliances', allianceId);
    const communityRef = doc(db, 'communities', communityId);

    await runTransaction(db, async (transaction) => {
      const allianceDoc = await transaction.get(allianceRef);
      if (!allianceDoc.exists()) {
        throw new Error('Alliance not found!');
      }

      const allianceData = allianceDoc.data() as Alliance;

      // Add to allianceMembers
      const allianceMemberRef = doc(allianceMembersCollection, `${allianceId}_${communityId}`);
      transaction.set(allianceMemberRef, {
        allianceId: allianceId,
        communityId: communityId,
        communityName: communityName,
        communityLeaderUid: communityLeaderUid,
        joinedAt: serverTimestamp(),
      });

      // Update community document
      transaction.update(communityRef, {
        allianceId: allianceId,
        allianceName: allianceData.name,
      });

      // Increment memberCommunityCount in alliance
      transaction.update(allianceRef, {
        memberCommunityCount: (allianceData.memberCommunityCount || 0) + 1,
      });
    });
    return true;
  } catch (error) {
    console.error('Error joining alliance:', error);
    return false;
  }
};

export const leaveAlliance = async (allianceId: string, communityId: string): Promise<boolean> => {
  try {
    const allianceRef = doc(db, 'alliances', allianceId);
    const communityRef = doc(db, 'communities', communityId);
    const allianceMemberRef = doc(allianceMembersCollection, `${allianceId}_${communityId}`);

    await runTransaction(db, async (transaction) => {
      const allianceDoc = await transaction.get(allianceRef);
      if (!allianceDoc.exists()) {
        throw new Error('Alliance not found!');
      }
      const allianceData = allianceDoc.data() as Alliance;

      // Remove from allianceMembers
      transaction.delete(allianceMemberRef);

      // Update community document
      transaction.update(communityRef, {
        allianceId: null, // Or use FieldValue.delete() if you want to remove the field
        allianceName: null, // Or use FieldValue.delete()
      });

      // Decrement memberCommunityCount in alliance
      transaction.update(allianceRef, {
        memberCommunityCount: Math.max(0, (allianceData.memberCommunityCount || 0) - 1),
      });
    });
    return true;
  } catch (error) {
    console.error('Error leaving alliance:', error);
    return false;
  }
};

export const getCommunitiesInAlliance = async (allianceId: string): Promise<AllianceMember[]> => {
  try {
    const q = query(allianceMembersCollection, where('allianceId', '==', allianceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ membershipId: doc.id, ...doc.data() } as AllianceMember));
  } catch (error) {
    console.error('Error fetching communities in alliance:', error);
    return [];
  }
};

// --- Alliance Posts & Comments --- 

export const createAlliancePost = async (postData: Omit<AlliancePost, 'postId' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(alliancePostsCollection, {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    });
    // Update post with its own ID
    await updateDoc(docRef, { postId: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('Error creating alliance post:', error);
    return null;
  }
};

export const getAlliancePosts = async (allianceId: string): Promise<AlliancePost[]> => {
  try {
    const q = query(alliancePostsCollection, where('allianceId', '==', allianceId), where('createdAt', '!=', null)); // Ensure createdAt is not null for ordering
    const snapshot = await getDocs(q);
    // Sort by createdAt descending
    const posts = snapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() } as AlliancePost));
    posts.sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
    return posts;
  } catch (error) {
    console.error('Error fetching alliance posts:', error);
    return [];
  }
};

export const listenToAlliancePosts = (
  allianceId: string,
  callback: (posts: AlliancePost[]) => void,
  errorCallback?: (error: Error) => void
): (() => void) => {
  const q = query(
    alliancePostsCollection,
    where('allianceId', '==', allianceId),
    orderBy('createdAt', 'desc') // Ensure posts are ordered
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() } as AlliancePost));
    callback(posts);
  }, (error) => {
    console.error(`Error listening to alliance posts for ${allianceId}:`, error);
    if (errorCallback) {
      errorCallback(error);
    }
    // Optionally, notify the user or retry
    // callback([]); // Or send empty array on error or handle as needed
  });

  return unsubscribe;
};

export const getAlliancePostById = async (postId: string): Promise<AlliancePost | null> => {
  try {
    const postRef = doc(db, 'alliancePosts', postId);
    const postSnap = await getDoc(postRef);
    return postSnap.exists() ? { postId: postSnap.id, ...postSnap.data() } as AlliancePost : null;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return null;
  }
};

export const listenToAlliancePostComments = (
  postId: string,
  callback: (comments: AlliancePostComment[]) => void
): (() => void) => { // Returns an unsubscribe function
  const commentsSubCollection = collection(doc(db, 'alliancePosts', postId), 'comments');
  const q = query(
    commentsSubCollection,
    orderBy('createdAt', 'asc') // Ensure comments are ordered
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ commentId: doc.id, ...doc.data() } as AlliancePostComment));
    callback(comments);
  }, (error) => {
    console.error('Error listening to alliance post comments:', error);
    // Optionally, notify the user or retry
    callback([]); // Send empty array on error or handle as needed
  });

  return unsubscribe; // Return the unsubscribe function for cleanup
};

export const getAlliancePostComments = async (postId: string): Promise<AlliancePostComment[]> => {
  try {
    const commentsSubCollection = collection(doc(db, 'alliancePosts', postId), 'comments');
    const q = query(commentsSubCollection, where('createdAt', '!=', null)); // Ensure createdAt is not null for ordering
    const snapshot = await getDocs(q);
    // Sort by createdAt ascending
    const comments = snapshot.docs.map(doc => ({ commentId: doc.id, ...doc.data() } as AlliancePostComment));
    comments.sort((a, b) => (a.createdAt as Timestamp).toMillis() - (b.createdAt as Timestamp).toMillis());
    return comments;
  } catch (error) {
    console.error('Error fetching alliance post comments:', error);
    return [];
  }
};

// Basic like/unlike functionality for alliance posts (can be expanded)
export const likeAlliancePost = async (postId: string, userId: string) => {
  // This would typically involve a subcollection for likes to track individual users
  // For simplicity, just incrementing count
  const postRef = doc(db, 'alliancePosts', postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const postData = postSnap.data() as AlliancePost;
    await updateDoc(postRef, { likesCount: (postData.likesCount || 0) + 1 });
  }
};

export const unlikeAlliancePost = async (postId: string, userId: string) => {
  const postRef = doc(db, 'alliancePosts', postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const postData = postSnap.data() as AlliancePost;
    await updateDoc(postRef, { likesCount: Math.max(0, (postData.likesCount || 0) - 1) });
  }
};

export const createAlliancePostComment = async (
  allianceId: string,
  postId: string,
  commentData: Omit<AlliancePostComment, 'commentId' | 'createdAt' | 'likesCount' | 'allianceId' | 'postId'>
): Promise<string | null> => {
  try {
    const postRef = doc(db, 'alliancePosts', postId);
    const commentsSubCollection = collection(postRef, 'comments');
    
    const commentRef = await addDoc(commentsSubCollection, {
      ...commentData,
      allianceId,
      postId,
      createdAt: serverTimestamp(),
      likesCount: 0,
    });

    // Update comment with its own ID
    await updateDoc(commentRef, { commentId: commentRef.id });

    // Increment commentsCount on the post
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw 'Post does not exist!';
      }
      const newCommentsCount = (postDoc.data().commentsCount || 0) + 1;
      transaction.update(postRef, { commentsCount: newCommentsCount });
    });

    return commentRef.id;
  } catch (error) {
    console.error('Error creating alliance post comment:', error);
    return null;
  }
};
