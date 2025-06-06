import type { User as FirebaseUser, UserCredential } from 'firebase/auth';
import type { ReactNode } from 'react';

// Extend Firebase User with ledCommunityIds
export interface AppUser extends FirebaseUser {
  ledCommunityIds?: string[]; // Assuming it's an array of strings and optional
  // Add any other custom user properties here
}

export interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}
