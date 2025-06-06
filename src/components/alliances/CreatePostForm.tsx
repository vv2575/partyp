'use client';

import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { createAlliancePost } from '@/firebase/allianceService'; // Assuming path
import type { User } from '@/types/user'; // Assuming path
import type { Community } from '@/types/community'; // Assuming path

type CreateAlliancePostData = {
  allianceId: string;
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  authorCommunityId: string;
  authorCommunityName: string;
  content: string;
  mediaUrls?: string[];
};

interface CreatePostFormProps {
  allianceId: string;
  currentUser: User | null; // User creating the post
  userPrimaryCommunityId?: string | null; 
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ allianceId, currentUser, userPrimaryCommunityId }) => {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]); // Simple array of URLs for now
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to create a post.');
      return;
    }
    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }
    // A more robust solution for community context would be needed here.
    // For example, if a user is part of multiple communities in the alliance.
    // Or, if the post is on behalf of a specific community they represent.
    const authorCommunityId = userPrimaryCommunityId || 'unknown_community';
    // Since we only have the ID, we can't get the name directly without fetching.
    // Using a placeholder or a generic name for now.
    const authorCommunityName = userPrimaryCommunityId ? `Community (${userPrimaryCommunityId.substring(0,6)}...)` : 'Unknown Community';

    setIsSubmitting(true);
    setError(null);

    try {
      const postData: CreateAlliancePostData = {
        allianceId,
        authorUid: currentUser.uid,
        authorDisplayName: currentUser.displayName || 'Anonymous User',
        authorCommunityId: authorCommunityId,
        authorCommunityName: authorCommunityName,
        content,
        mediaUrls: mediaUrls.filter(url => url.trim() !== ''),
        // likesCount and commentsCount will be initialized by the backend service
      };

      if (currentUser.photoURL) {
        postData.authorPhotoURL = currentUser.photoURL;
      }

      const postId = await createAlliancePost(postData);

      if (postId) {
        setContent('');
        setMediaUrls([]);
        // Optionally, trigger a refetch or show a success message
      } else {
        setError('Failed to create post. Please try again.');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('An unexpected error occurred while creating the post.');
    }
    setIsSubmitting(false);
  };

  // Basic media URL input - in a real app, this would be a file uploader
  const handleAddMediaUrl = () => {
    setMediaUrls([...mediaUrls, '']);
  };

  const handleMediaUrlChange = (index: number, value: string) => {
    const newMediaUrls = [...mediaUrls];
    newMediaUrls[index] = value;
    setMediaUrls(newMediaUrls);
  };

  const handleRemoveMediaUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
      <h3 className="text-xl font-semibold text-[#005A9C] mb-3">Create New Post</h3>
      <div>
        <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 mb-1">Your thoughts?</label>
        <textarea
          id="postContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Share something with the ${allianceId} alliance...`}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#F57C00] focus:border-[#F57C00] transition-colors duration-200"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Media URLs (optional)</label>
        {mediaUrls.map((url, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input 
              type="url" 
              placeholder="https://example.com/image.png"
              value={url}
              onChange={(e) => handleMediaUrlChange(index, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#F57C00] focus:border-[#F57C00]"
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              onClick={() => handleRemoveMediaUrl(index)} 
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
              disabled={isSubmitting}
            >
              Remove
            </button>
          </div>
        ))}
        <button 
          type="button" 
          onClick={handleAddMediaUrl} 
          className="px-4 py-2 border border-dashed border-[#00A99D] text-[#00A99D] rounded-md hover:bg-[#00A99D] hover:text-white transition-colors duration-200 text-sm"
          disabled={isSubmitting}
        >
          Add Media URL
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !content.trim() || !currentUser}
        className="w-full px-6 py-3 bg-[#F57C00] text-white font-semibold rounded-md shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F57C00] disabled:opacity-50 transition-opacity duration-200"
      >
        {isSubmitting ? 'Posting...' : 'Create Post'}
      </button>
      {!currentUser && <p className="text-xs text-red-500 mt-2 text-center">Please log in to post.</p>}
    </form>
  );
};

export default CreatePostForm;
