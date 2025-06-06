import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  location?: string;
  expertise?: string[];
  bio?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ledCommunityIds?: string[];
  createdAllianceIds?: string[]; // Added as per APP_PLAN for users who create alliances
}
