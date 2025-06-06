'use client';

import React from 'react';
import styles from './how-it-works-section.module.css'; // Assumes CSS module is in the same directory

const steps = [
  {
    id: 1,
    title: 'Discover & Join/Create Communities',
    description: 'Find or establish groups based on shared interests (location or expertise).',
    icon: '🔍', // Placeholder icon
  },
  {
    id: 2,
    title: 'Engage & Discuss',
    description: 'Participate in conversations within your communities by posting and commenting.',
    icon: '💬', // Placeholder icon
  },
  {
    id: 3,
    title: 'Form Alliances',
    description: 'Community leaders can unite their communities with others to broaden their collective voice.',
    icon: '🤝', // Placeholder icon
  },
  {
    id: 4,
    title: 'Collaborate at Scale',
    description: 'Engage in discussions and initiatives at the alliance level.',
    icon: '🚀', // Placeholder icon
  },
  {
    id: 5,
    title: 'Amplify Your Impact',
    description: 'Work together to achieve common goals and influence outcomes.',
    icon: '🎯', // Placeholder icon
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className={styles.howItWorksSection}>
      <h2 className={styles.sectionTitle}>How Does It Work?</h2>
      <div className={styles.stepsGrid}>
        {steps.map((step, index) => (
          <div key={step.id} className={styles.stepCard}>
            {/* For animation, you can add Framer Motion props here */}
            <div className={styles.stepIcon}>{step.icon}</div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDescription}>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
