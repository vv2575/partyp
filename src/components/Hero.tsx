import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.animatedBackground}>
        <div className={styles.overlayGradient1}></div>
        <div className={styles.overlayGradient2}></div>
      </div>
      
      <div className={styles.floatingShapesContainer}>
        <div className={`${styles.shape} ${styles.shape1}`}></div>
        <div className={`${styles.shape} ${styles.shape2}`}></div>
        <div className={`${styles.shape} ${styles.shape3}`}></div>
      </div>
      
      <div className={styles.mainContent}>
        <h1 className={styles.mainHeading}>
          <span className={`${styles.headingSpan} ${styles.spanPrimary}`}>
            Rise Up,
          </span>{' '}
          <span className={`${styles.headingSpan} ${styles.spanSecondaryGradient}`}>
            Unite,
          </span>{' '}
          <span className={`${styles.headingSpan} ${styles.spanAccentGradient}`}>
            Ignite Change!
          </span>
        </h1>
        
        <p className={styles.subTitle}>
          Join the Halla Bol movement—connect with communities that amplify your voice for impact.
        </p>
        
        <div className={styles.ctaButtons}>
          <Link href="/communities/create" passHref>
            <button type="button" className={styles.buttonPrimary}>
              Raise Your Voice Now
            </button>
          </Link>
          
          <Link href="/communities" passHref>
            <button type="button" className={styles.buttonSecondary}>
              Discover the Movement
            </button>
          </Link>
        </div>
      </div>
      
      <div className={styles.scrollIndicator}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </div>
    </section>
  );
}