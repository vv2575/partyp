import { db } from '../lib/firebase';
import {
  collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp, runTransaction, writeBatch, serverTimestamp, FieldValue, arrayUnion, arrayRemove,
  setDoc
} from 'firebase/firestore';
import type { Community, CommunityMember, CommunityPost, CommunityPostComment } from '../types/community';
import type { User } from '../types/user';

const communitiesCollection = collection(db, 'communities');
const communityMembersCollection = collection(db, 'communityMembers');
const communityPostsCollection = collection(db, 'communityPosts');

// --- Community Management --- 

export const createCommunity = async (communityData: Omit<Community, 'communityId' | 'createdAt' | 'updatedAt' | 'memberCount' | 'leaderName'>, leader: User): Promise<string | null> => {
  try {
    const newCommunityRef = doc(communitiesCollection); // Generate ID upfront
    const communityId = newCommunityRef.id;

    const batch = writeBatch(db);

    // 1. Create Community Document
    batch.set(newCommunityRef, {
      ...communityData,
      communityId: communityId,
      leaderName: leader.displayName,
      memberCount: 1, // Starts with the leader
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Add Leader to CommunityMembers
    const communityMemberRef = doc(communityMembersCollection, `${communityId}_${leader.uid}`);
    batch.set(communityMemberRef, {
      communityId: communityId,
      userId: leader.uid,
      userDisplayName: leader.displayName,
      userPhotoURL: leader.photoURL || null,
      role: 'leader',
      status: 'approved',
      joinedAt: serverTimestamp(),
      requestedAt: serverTimestamp(),
    });

    // 3. Update User's ledCommunityIds
    const userRef = doc(db, 'users', leader.uid);
    batch.update(userRef, {
        ledCommunityIds: arrayUnion(communityId)
    });

    await batch.commit();
    return communityId;
  } catch (error) {
    console.error('Error creating community:', error);
    return null;
  }
};

export const getCommunityById = async (communityId: string): Promise<Community | null> => {
  try {
    const docRef = doc(db, 'communities', communityId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { communityId: docSnap.id, ...docSnap.data() } as Community;
    }
    return null;
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
};

export const getAllCommunities = async (): Promise<Community[]> => {
  try {
    const snapshot = await getDocs(communitiesCollection);
    return snapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
  } catch (error) {
    console.error('Error fetching all communities:', error);
    return [];
  }
};

export const getCommunitiesByLeader = async (leaderUid: string): Promise<Community[]> => {
  try {
    const q = query(communitiesCollection, where('leaderUid', '==', leaderUid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
  } catch (error) {
    console.error('Error fetching communities by leader:', error);
    return [];
  }
};

export const updateCommunityDetails = async (communityId: string, updates: Partial<Omit<Community, 'communityId' | 'createdAt' | 'updatedAt' | 'memberCount' | 'leaderName' | 'leaderUid'>>) => {
  try {
    const communityRef = doc(db, 'communities', communityId);
    await updateDoc(communityRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating community details:', error);
    return false;
  }
};

// --- Community Membership --- (Phase 2 features, adding basic structure)

export const requestToJoinCommunity = async (communityId: string, userId: string, userDisplayName: string, userPhotoURL?: string): Promise<string | null> => {
  try {
    const membershipId = `${communityId}_${userId}`;
    const memberRef = doc(communityMembersCollection, membershipId);
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists() && (memberSnap.data().status === 'approved' || memberSnap.data().status === 'pending')) {
        console.log('User already a member or request pending.');
        return memberSnap.data().status;
    }

    await setDoc(memberRef, {
        communityId,
        userId,
        userDisplayName,
        userPhotoURL: userPhotoURL || null,
        role: 'member',
        status: 'pending', // Phase 2: approval needed
        // status: 'approved', // Phase 1: open joining
        requestedAt: serverTimestamp(),
    });
    // For Phase 1 (open joining), you would also increment memberCount here.
    // For Phase 2, memberCount is updated upon approval.
    return 'pending';
  } catch (error) {
    console.error('Error requesting to join community:', error);
    return null;
  }
};

// Placeholder for Phase 2
export const approveCommunityJoinRequest = async (communityId: string, userId: string): Promise<boolean> => {
    const memberRef = doc(communityMembersCollection, `${communityId}_${userId}`);
    const communityRef = doc(communitiesCollection, communityId);
    try {
        await runTransaction(db, async (transaction) => {
            const memberDoc = await transaction.get(memberRef);
            const communityDoc = await transaction.get(communityRef);
            if (!memberDoc.exists() || !communityDoc.exists()) {
                throw new Error("Member or Community not found");
            }
            if (memberDoc.data().status !== 'pending') {
                throw new Error("Request is not pending approval");
            }
            transaction.update(memberRef, { status: 'approved', joinedAt: serverTimestamp() });
            transaction.update(communityRef, { memberCount: (communityDoc.data().memberCount || 0) + 1 });
        });
        return true;
    } catch (error) {
        console.error('Error approving join request:', error);
        return false;
    }
};

// Placeholder for Phase 2
export const rejectCommunityJoinRequest = async (communityId: string, userId: string): Promise<boolean> => {
    const memberRef = doc(communityMembersCollection, `${communityId}_${userId}`);
    try {
        await updateDoc(memberRef, { status: 'rejected' });
        return true;
    } catch (error) {
        console.error('Error rejecting join request:', error);
        return false;
    }
};


// --- Community Posts & Comments --- (Phase 1 & 2 features)

export const createCommunityPost = async (postData: Omit<CommunityPost, 'postId' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(communityPostsCollection, {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    });
    await updateDoc(docRef, { postId: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error('Error creating community post:', error);
    return null;
  }
};

export const getCommunityPosts = async (communityId: string): Promise<CommunityPost[]> => {
  try {
    const q = query(communityPostsCollection, where('communityId', '==', communityId), where('createdAt', '!=', null));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() } as CommunityPost));
    posts.sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
    return posts;
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return [];
  }
};

// ... other community service functions (comments, likes etc. as per APP_PLAN) ...
