'use client';

import React, { useState } from 'react';
import { createAlliancePostComment } from '@/firebase/allianceService'; // Assuming path
import type { User } from '@/types/user'; // Assuming path

interface CreateCommentFormProps {
  allianceId: string;
  postId: string;
  currentUser: User | null;
}

const CreateCommentForm: React.FC<CreateCommentFormProps> = ({ allianceId, postId, currentUser }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to comment.');
      return;
    }
    if (!content.trim()) {
      setError('Comment cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const commentId = await createAlliancePostComment(allianceId, postId, {
        authorUid: currentUser.uid,
        authorDisplayName: currentUser.displayName || 'Anonymous User',
        authorPhotoURL: currentUser.photoURL || undefined,
        content,
        // likesCount will be initialized by the backend service
      });

      if (commentId) {
        setContent('');
        // Optionally, trigger a refetch or show a success message
      } else {
        setError('Failed to post comment. Please try again.');
      }
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('An unexpected error occurred while posting the comment.');
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      <label htmlFor={`commentContent-${postId}`} className="block text-sm font-medium text-gray-700">Add a comment</label>
      <textarea
        id={`commentContent-${postId}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment..."
        rows={2}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#F57C00] focus:border-[#F57C00] transition-colors duration-200"
        disabled={isSubmitting}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim() || !currentUser}
          className="px-4 py-2 bg-[#00A99D] text-white text-sm font-semibold rounded-md shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A99D] disabled:opacity-50 transition-opacity duration-200"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
      {!currentUser && <p className="text-xs text-red-500 mt-1 text-right">Please log in to comment.</p>}
    </form>
  );
};

export default CreateCommentForm;
