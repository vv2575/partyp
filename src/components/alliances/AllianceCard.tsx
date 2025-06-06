import React from 'react';
import Link from 'next/link';
import { Alliance } from '@/types/alliance';
import styles from './AllianceCard.module.css'; // We'll create this CSS module next

interface AllianceCardProps {
  alliance: Alliance;
}

const AllianceCard: React.FC<AllianceCardProps> = ({ alliance }) => {
  return (
    <div className={styles.cardContainer}>
      {alliance.bannerImageUrl && (
        <div className={styles.bannerImageContainer}>
          <img src={alliance.bannerImageUrl} alt={`${alliance.name} banner`} className={styles.bannerImage} />
        </div>
      )}
      <div className={styles.cardContent}>
        <h3 className={styles.allianceName}>
          <Link href={`/alliances/${alliance.allianceId}`} className={styles.link}>
            {alliance.name}
          </Link>
        </h3>
        <p className={styles.description}>{alliance.description.substring(0, 100)}{alliance.description.length > 100 ? '...' : ''}</p>
        <div className={styles.cardMeta}>
          <p>Creator: {alliance.creatorName}</p>
          <p>Communities: {alliance.memberCommunityCount}</p>
        </div>
        <Link href={`/alliances/${alliance.allianceId}`} className={styles.viewButton}>
          View Alliance
        </Link>
      </div>
    </div>
  );
};

export default AllianceCard;
