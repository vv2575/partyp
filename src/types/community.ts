import { Timestamp } from 'firebase/firestore';

export interface Community {
  communityId: string; // Assuming auto-generated ID will be added to the object
  name: string;
  description: string;
  type: 'location' | 'expertise';
  basisDetail: string;
  leaderUid: string;
  leaderName: string;
  memberCount: number;
  requiresApproval?: boolean;
  allowStormIn?: boolean;
  allianceId?: string;
  allianceName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  bannerImageUrl?: string;
  thumbnail?: string;
  postsCount?: number;
}

export interface CommunityMember {
  membershipId: string; // Assuming auto-generated or composite ID will be added
  communityId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  role: 'leader' | 'member';
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  joinedAt?: Timestamp;
  requestedAt: Timestamp;
}

export interface CommunityPost {
  postId: string; // Assuming auto-generated ID
  communityId: string;
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  content: string;
  mediaUrls?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likesCount: number;
  commentsCount: number;
  // Comments would be a subcollection, their type can be defined here or separately if complex
}

export interface CommunityPostComment {
  commentId: string; // Assuming auto-generated ID
  postId: string; // To link back to the post
  communityId: string; // To link back to the community
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
  likesCount: number;
}
