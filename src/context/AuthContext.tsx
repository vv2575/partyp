'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../lib/firebase'; // Added db
import { 
  User as FirebaseUser, // Renamed User to FirebaseUser for clarity
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Added Firestore functions
import type { AppUser, AuthContextType, AuthProviderProps } from '../types/auth'; // Added AppUser

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential && userCredential.user) {
      const fbUser = userCredential.user;
      await updateProfile(fbUser, { displayName });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      try {
        await setDoc(userDocRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayName, // Use the passed displayName as it's the intended one
          photoURL: fbUser.photoURL || null,
          ledCommunityIds: [], // Initialize ledCommunityIds as an empty array
          // Add any other default fields for a new user profile here
        });
      } catch (error) {
        console.error("Error creating user document in Firestore:", error);
        // Optionally, handle the error more gracefully, e.g., by trying to delete the Firebase user
        // or flagging the account as incompletely set up.
      }
    }
    return userCredential;
  };

  const login = (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = (): Promise<void> => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('[AuthContext] onAuthStateChanged triggered. Firebase user:', firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName } : null);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let appUser: AppUser;
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            console.log('[AuthContext] Firestore user document found:', firestoreData);
            // Construct AppUser, ensuring ledCommunityIds defaults to []
            // Prioritize Firebase auth data for core fields, then supplement with Firestore data.
            appUser = {
              // Start with all properties from firebaseUser
              ...firebaseUser,
              // Explicitly set core Firebase properties to ensure they are not overwritten by potentially stale Firestore data
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              // Merge other Firestore data
              ...firestoreData,
              // Ensure ledCommunityIds is an array, defaulting to [] if not present or falsy in firestoreData
              ledCommunityIds: firestoreData.ledCommunityIds || [],
            };
          } else {
            console.warn(`[AuthContext] User document NOT FOUND in Firestore for UID: ${firebaseUser.uid}. Initializing AppUser with Firebase data and default empty ledCommunityIds.`);
            // User exists in Firebase Auth, but not in Firestore.
            appUser = {
              ...firebaseUser,
              uid: firebaseUser.uid, // Ensure uid is present
              ledCommunityIds: [], // Default to empty array
            };
          }
        } catch (error) {
          console.error("[AuthContext] Error fetching user document from Firestore:", error);
          // Fallback: create an AppUser from FirebaseUser data only, defaulting ledCommunityIds
          appUser = {
            ...firebaseUser,
            uid: firebaseUser.uid, // Ensure uid is present
            ledCommunityIds: [], // Default to empty array
          };
        }
        console.log('[AuthContext] Attempting to set currentUser:', appUser);
        setCurrentUser(appUser);
      } else {
        console.log('[AuthContext] No Firebase user. Setting currentUser to null.');
        setCurrentUser(null);
      }
      setLoading(false);
      console.log('[AuthContext] Loading state set to false. CurrentUser after potential update (Note: may show previous state due to async nature):', currentUser);
    });

    return () => {
      console.log('[AuthContext] Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // currentUser was removed from dependency array as it caused re-runs; onAuthStateChanged should run once on mount.

  const value: AuthContextType = {
    currentUser,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
