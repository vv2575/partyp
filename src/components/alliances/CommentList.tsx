'use client';

import React, { useEffect, useState } from 'react';
import { listenToAlliancePostComments } from '@/firebase/allianceService'; // Assuming path
import type { AlliancePostComment } from '@/types/alliance'; // Assuming path
import type { User } from '@/types/user'; // For currentUser prop
import CommentItem from './CommentItem'; // Import CommentItem

interface CommentListProps {
  postId: string;
  allianceId: string; // Added to potentially scope comments or for other context
  currentUser?: User | null; // Current logged-in user, optional
}

const CommentList: React.FC<CommentListProps> = ({ postId, allianceId, currentUser }) => {
  const [comments, setComments] = useState<AlliancePostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      setError('Post ID is missing for comments.');
      return;
    }

    setLoading(true);
    const unsubscribe = listenToAlliancePostComments(
      postId, 
      (updatedComments) => {
        setComments(updatedComments);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [postId]);

  if (loading) {
    return <div className="text-center py-3 text-xs text-gray-500">Loading comments...</div>;
  }

  if (error) {
    return <div className="text-center py-3 text-xs text-red-500">{error}</div>;
  }

  if (comments.length === 0) {
    return <p className="text-sm text-gray-500 py-3 text-center">No comments yet. Be the first to reply!</p>;
  }

  return (
    <div className="space-y-3 mt-3">
      {comments.map(comment => (
        <CommentItem 
          key={comment.commentId} 
          comment={comment} 
          currentUser={currentUser} 
        />
      ))}
    </div>
  );
};

export default CommentList;
