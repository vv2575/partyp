'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';


 // Adjusted path
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/profile'); // Redirect to profile page or homepage after login
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  };

  // If user is already logged in, redirect them
  if (currentUser) {
    router.push('/profile'); // Or wherever you want to redirect logged-in users
    return null; // Render nothing while redirecting
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Login</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        <Link href="/auth/signup" className={styles.link}>
          Don't have an account? Sign Up
        </Link>
        {/* Optional: Add a link for password reset here */}
        {/* <Link href="/auth/forgot-password" className={styles.link}>
          Forgot Password?
        </Link> */}
      </div>
    </div>
  );
}
