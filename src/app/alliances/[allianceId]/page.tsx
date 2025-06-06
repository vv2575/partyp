'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAllianceById, getCommunitiesInAlliance } from '@/firebase/allianceService'; 
import type { Alliance, AllianceMember } from '@/types/alliance'; 
import PostList from '@/components/alliances/PostList';
import AllianceMemberList from '@/components/alliances/AllianceMemberList';
import { useAuth } from '@/context/AuthContext'; 
import type { User } from '@/types/user'; 
import AllianceManagementDashboard from '@/components/alliances/AllianceManagementDashboard'; 

import styles from './AllianceDetailPage.module.css'; // Import the CSS module

export default function AllianceDetailPage() {
  const params = useParams();
  const allianceId = params.allianceId as string;

  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [members, setMembers] = useState<AllianceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useAuth() as { currentUser: User | null }; 
  const userPrimaryCommunityId = currentUser?.ledCommunityIds?.[0] || null;

  useEffect(() => {
    if (!allianceId) return;

    const fetchAllianceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const allianceData = await getAllianceById(allianceId);
        if (allianceData) {
          setAlliance(allianceData);
          const memberData = await getCommunitiesInAlliance(allianceId);
          setMembers(memberData);
        } else {
          setError('Alliance not found.');
        }
      } catch (err) {
        console.error('Error fetching alliance details:', err);
        setError('Failed to load alliance details.');
      }
      setLoading(false);
    };

    fetchAllianceData();
  }, [allianceId]);

  if (loading) {
    return <div className={styles.loadingState}>Loading alliance details...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  if (!alliance) {
    return <div className={styles.notFoundState}>Alliance not found.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.allianceName}>{alliance.name}</h1>
        <p className={styles.allianceDescription}>{alliance.description}</p>
        {alliance.bannerImageUrl && (
          <div className={styles.bannerImageContainer}>
            <img
              src={alliance.bannerImageUrl}
              alt={`${alliance.name} banner`}
              className={styles.bannerImage}
            />
          </div>
        )}
        <div className={styles.metaInfo}>
          <p>Created by: {alliance.creatorName}</p>
          <p>Member Communities: {alliance.memberCommunityCount}</p>
        </div>
      </header>

      <section id="discussion" className={styles.section}>
        <h2 className={styles.sectionTitle}>Discussion</h2>
        {/* Removed the inner div as .section now provides padding and background */}
        {allianceId && (
          <PostList
            allianceId={allianceId}
            currentUser={currentUser}
            userPrimaryCommunityId={userPrimaryCommunityId}
          />
        )}
      </section>

      <section id="members" className={styles.section}>
        <h2 className={styles.sectionTitle}>Member Communities</h2>
        {/* Removed the inner div */}
        {allianceId && <AllianceMemberList allianceId={allianceId} initialMembers={members} />}
      </section>

      {alliance && currentUser && currentUser.uid === alliance.creatorUid && (
        <section id="alliance-management" className={`${styles.section} ${styles.managementDashboardContainer}`}>
           <h2 className={styles.sectionTitle}>Alliance Management</h2>
          <AllianceManagementDashboard alliance={alliance} currentUser={currentUser} />
        </section>
      )}
    </div>
  );
}