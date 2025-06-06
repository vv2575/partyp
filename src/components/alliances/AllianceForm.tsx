import React, { useState, useEffect } from 'react';
import { Alliance } from '@/types/alliance';
import { User } from '@/types/user';
import { Community } from '@/types/community';
import styles from './AllianceForm.module.css'; // We'll create this CSS module next

interface AllianceFormProps {
  currentUser: User;
  userLedCommunities: Community[]; // Communities led by the current user
  onSubmit: (formData: Omit<Alliance, 'allianceId' | 'createdAt' | 'updatedAt' | 'memberCommunityCount' | 'creatorUid' | 'creatorName'>, initialCommunityId: string) => Promise<void>;
  initialData?: Alliance;
  isSubmitting?: boolean;
}

const AllianceForm: React.FC<AllianceFormProps> = ({ currentUser, userLedCommunities, onSubmit, initialData, isSubmitting }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [bannerImageUrl, setBannerImageUrl] = useState(initialData?.bannerImageUrl || '');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setBannerImageUrl(initialData.bannerImageUrl || '');
    }
    
    if (userLedCommunities.length > 0) {
      setSelectedCommunityId(userLedCommunities[0].communityId);
    }
    setIsLoading(false);
  }, [initialData, userLedCommunities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !description.trim()) {
      setError('Alliance name and description are required.');
      return;
    }

    if (!initialData && !selectedCommunityId) {
        setError('You must select one of your led communities to initiate the alliance.');
        return;
    }

    const formData = {
      name,
      description,
      bannerImageUrl: bannerImageUrl || undefined,
    };

    try {
      await onSubmit(formData, selectedCommunityId);
      // Optionally reset form: setName(''); setDescription(''); setBannerImageUrl(''); setSelectedCommunityId(userLedCommunities[0]?.communityId || '');
    } catch (err: any) {
      setError(err.message || 'Failed to submit alliance data.');
    }
  };

  if (isLoading) {
    return <p className={styles.infoText}>Loading your communities...</p>;
  }

  if (userLedCommunities.length === 0 && !initialData) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>
          You must be a leader of at least one community to create an alliance. 
          <a href="/communities/create" className={styles.link}>Create a community first</a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h2 className={styles.formTitle}>{initialData ? 'Edit Alliance' : 'Create New Alliance'}</h2>
      
      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.formGroup}>
        <label htmlFor="allianceName" className={styles.label}>Alliance Name</label>
        <input
          type="text"
          id="allianceName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="allianceDescription" className={styles.label}>Description</label>
        <textarea
          id="allianceDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          rows={4}
          required
          disabled={isSubmitting}
        />
      </div>

      {!initialData && userLedCommunities.length > 0 && (
        <div className={styles.formGroup}>
          <label htmlFor="initialCommunity" className={styles.label}>
            Initial Community (Your Led Community)
            {userLedCommunities.length === 0 && (
              <span className={styles.errorText}> No communities found where you are a leader</span>
            )}
          </label>
          <select
            id="initialCommunity"
            value={selectedCommunityId}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
            className={styles.select}
            required
            disabled={isSubmitting || userLedCommunities.length === 0}
          >
            {userLedCommunities.map(community => (
              <option key={community.communityId} value={community.communityId}>
                {community.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="bannerImageUrl" className={styles.label}>Banner Image URL (Optional)</label>
        <input
          type="url"
          id="bannerImageUrl"
          value={bannerImageUrl}
          onChange={(e) => setBannerImageUrl(e.target.value)}
          className={styles.input}
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Alliance')}
      </button>
    </form>
  );
};

export default AllianceForm;
