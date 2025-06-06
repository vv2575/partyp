import Link from 'next/link';
import type { Community as CommunityType } from '@/types/community';
import styles from './CommunityCard.module.css';

interface Props { 
  community: CommunityType & { postsCount?: number }; 
}

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM1.396 16.72a11.912 11.912 0 015.23-3.061 3.002 3.002 0 00-1.265.792 8.913 8.913 0 00-3.014 2.461.75.75 0 101.119.997 7.413 7.413 0 012.604-2.104A1.5 1.5 0 017 14.5h.001c.07 0 .14.008.209.024a4.5 4.5 0 011.89-.666 8.413 8.413 0 001.96.06A4.502 4.502 0 0113 14.5h.001a1.5 1.5 0 011.06.44 7.416 7.416 0 012.605 2.104.75.75 0 101.118-.997 8.912 8.912 0 00-3.013-2.461 3.002 3.002 0 00-1.266-.792 11.915 11.915 0 015.231 3.061.75.75 0 00.8-.997A13.416 13.416 0 007.001 12H7a13.415 13.415 0 00-6.404 3.723.75.75 0 00.8.997z" />
  </svg>
);

export default function CommunityCard({ community }: Props) {
  return (
    <div className={styles.communityCard}>
      <div className={styles.banner}>
        {community.bannerImageUrl ? (
          <img
            src={community.bannerImageUrl}
            alt={`${community.name} banner`}
            className={styles.bannerImage}
          />
        ) : (
          <span className={styles.bannerInitial}>
            {community.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name} title={community.name}>{community.name}</h3>
        <p className={styles.description} title={community.description}>{community.description || 'No description available.'}</p>
        <div className={styles.footer}>
          <span className={styles.memberInfo}>
            <IconUsers />
            {community.memberCount || 0} Members
          </span>
          <Link
            href={`/communities/${community.communityId}`}
            className={styles.joinButton}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
