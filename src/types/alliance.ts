import { Timestamp } from 'firebase/firestore';

export interface Alliance {
  allianceId: string; // Assuming auto-generated ID will be added
  name: string;
  description: string;
  creatorUid: string; // User ID of the alliance creator (must be a community leader)
  creatorName: string;
  memberCommunityCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  bannerImageUrl?: string;
  rules?: string;
  visibility?: 'public' | 'private'; // Or other relevant visibility states
}

export interface AllianceMember {
  membershipId: string; // Assuming auto-generated or composite ID 'allianceId_communityId'
  allianceId: string;
  communityId: string;
  communityName: string;
  communityLeaderUid: string;
  joinedAt: Timestamp;
  status?: 'pending' | 'approved' | 'rejected' | 'active'; // Status of the membership
}

export interface AlliancePost {
  postId: string; // Assuming auto-generated ID
  allianceId: string;
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  authorCommunityId: string; // ID of the community the author belongs to
  authorCommunityName: string;
  content: string;
  mediaUrls?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likesCount: number;
  commentsCount: number;
}

export interface AlliancePostComment {
  commentId: string; // Assuming auto-generated ID
  postId: string; // To link back to the alliance post
  allianceId: string; // To link back to the alliance
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
  likesCount: number;
}
