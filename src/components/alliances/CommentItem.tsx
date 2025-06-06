'use client';

import React from 'react';
import type { AlliancePostComment } from '@/types/alliance'; // Assuming path
import type { User } from '@/types/user'; // Import your custom User type
// import { likeAllianceComment, unlikeAllianceComment } from '@/firebase/allianceService'; // Assuming these functions would exist

interface CommentItemProps {
  comment: AlliancePostComment;
  currentUser?: User | null; // Use custom User type, make optional and nullable
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUser }) => {
  const { authorDisplayName, authorPhotoURL, content, createdAt, likesCount } = comment;

  const handleLikeComment = async () => {
    if (!currentUser) return;
    // await likeAllianceComment(comment.commentId, currentUser.uid);
    console.log('Like comment action by:', currentUser.uid); // Example usage
  };

  const formattedDate = createdAt ? new Date(createdAt.toDate()).toLocaleString() : 'Date not available';

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
      {authorPhotoURL ? (
        <img src={authorPhotoURL} alt={authorDisplayName} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#00A99D] flex items-center justify-center text-white text-sm font-semibold">
          {authorDisplayName?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold text-[#005A9C]">{authorDisplayName}</h5>
            <time className="text-xs text-gray-400" dateTime={createdAt?.toDate().toISOString()}>{formattedDate}</time>
        </div>
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{content}</p>
        <div className="mt-1 flex items-center space-x-2">
          <button 
            // onClick={handleLikeComment}
            className="text-xs text-gray-500 hover:text-[#F57C00] flex items-center space-x-1"
            aria-label={`Like comment, current likes: ${likesCount || 0}`}
          >
            {/* Replace with a heart icon */}
            <span>❤️</span> 
            <span>{likesCount || 0}</span>
          </button>
          {/* Reply button can be added here */}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
