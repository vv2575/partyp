// src/types/profile.ts
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  bio?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  joinedCommunities?: string[]; // Array of community IDs the user has joined
  // Add other profile-specific fields as needed
}
