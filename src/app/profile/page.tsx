'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // Adjusted path
import styles from './profile.module.css'; // We'll create this CSS module next
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';

export default function ProfilePage() {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const [newDisplayName, setNewDisplayName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth/login');
    } else if (currentUser) {
      setNewDisplayName(currentUser.displayName || '');
    }
  }, [currentUser, loading, router]);

  const handleUpdateDisplayName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newDisplayName.trim()) {
        setError('Display name cannot be empty.');
        return;
    }
    setError('');
    setSuccessMessage('');
    setIsUpdating(true);
    try {
      await firebaseUpdateProfile(currentUser, { displayName: newDisplayName });
      // AuthContext's onAuthStateChanged will eventually update currentUser state,
      // or we can manually update it if AuthContext exposes a setter for currentUser.
      // For now, we rely on onAuthStateChanged or a page refresh.
      setSuccessMessage('Display name updated successfully!');
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update display name.');
    }
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (err: any) {
      setError('Failed to log out. ' + (err.message || ''));
    }
  };

  if (loading || !currentUser) {
    return <div className={styles.container}><p>Loading...</p></div>; // Or a proper loading spinner
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <h1 className={styles.title}>Your Profile</h1>
        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.success}>{successMessage}</p>}
        
        <div className={styles.infoItem}>
          <strong>Email:</strong> {currentUser.email}
        </div>

        {!editMode ? (
          <div className={styles.infoItem}>
            <strong>Display Name:</strong> {currentUser.displayName || 'Not set'}
            <button onClick={() => setEditMode(true)} className={styles.editButton}>Edit</button>
          </div>
        ) : (
          <form onSubmit={handleUpdateDisplayName} className={styles.editForm}>
            <div className={styles.formGroup}>
              <label htmlFor="newDisplayName">New Display Name:</label>
              <input
                type="text"
                id="newDisplayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                required
              />
            </div>
            <div className={styles.buttonGroup}>
                <button type="submit" className={styles.button} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setEditMode(false); setError(''); setNewDisplayName(currentUser.displayName || '');}} className={`${styles.button} ${styles.cancelButton}`} disabled={isUpdating}>
                Cancel
                </button>
            </div>
          </form>
        )}
        
        <button onClick={handleLogout} className={`${styles.button} ${styles.logoutButton}`}>
          Logout
        </button>
      </div>
    </div>
  );
}
