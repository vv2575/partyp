'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'; 
import { UsersIcon, UserGroupIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth(); 
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/'); 
    } catch (error) {
      console.error('Failed to logout:', error);
      // Handle logout error (e.g., show a notification)
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          <img src="/halla-bol-logo.png" alt="Halla Bol Logo" style={{ height: 80, width: 'auto', display: 'block' }} />
        </Link>
      </div>
      <button className={styles.hamburger} onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>
      <div className={`${styles.navLinks} ${isOpen ? styles.open : ''}`}>
        <Link href="/communities" className={styles.navLink}>
          <UsersIcon className="w-5 h-5" />
          Communities
        </Link>
        <Link href="/alliances" className={styles.navLink}>
          <UserGroupIcon className="w-5 h-5" />
          Alliances
        </Link>
        {currentUser ? (
          <>
            <Link href="/profile" className={styles.navLink}>
              <UserCircleIcon className="w-5 h-5" />
              Profile
            </Link>
            <button onClick={handleLogout} className={`${styles.navLink} ${styles.navButton}`}>
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className={styles.navLink}>
              <UserCircleIcon className="w-5 h-5" />
              Login
            </Link>
            <Link href="/auth/signup" className={styles.navLink}>
              <UserCircleIcon className="w-5 h-5" />
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;