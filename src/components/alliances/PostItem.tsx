'use client';

import React from 'react';
import type { AlliancePost } from '@/types/alliance'; 
import CommentList from './CommentList';
import CreateCommentForm from './CreateCommentForm';
// import { likeAlliancePost, unlikeAlliancePost } from '@/firebase/allianceService';
import type { User } from '@/types/user';

interface PostItemProps {
  post: AlliancePost;
  currentUser: User | null; 
}

const PostItem: React.FC<PostItemProps> = ({ post, currentUser }) => {
  const { 
    authorDisplayName, 
    authorPhotoURL, 
    authorCommunityName,
    content, 
    mediaUrls, 
    createdAt, 
    likesCount, 
    commentsCount 
  } = post;

  // const handleLike = async () => {
  //   if (!currentUser) return;
  //   // Add logic to check if already liked, then call likeAlliancePost or unlikeAlliancePost
  //   await likeAlliancePost(post.postId, currentUser.uid);
  // };

  const formattedDate = createdAt ? new Date(createdAt.toDate()).toLocaleString() : 'Date not available';

  return (
    <article className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <header className="flex items-start mb-4">
        {authorPhotoURL ? (
          <img src={authorPhotoURL} alt={authorDisplayName} className="w-12 h-12 rounded-full mr-4 object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#00A99D] flex items-center justify-center text-white text-xl font-semibold mr-4">
            {authorDisplayName?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-bold text-lg text-[#005A9C]">{authorDisplayName}</h3>
          <p className="text-sm text-gray-600">from {authorCommunityName}</p>
          <time className="text-xs text-gray-400" dateTime={createdAt?.toDate().toISOString()}>{formattedDate}</time>
        </div>
      </header>

      <div className="prose prose-sm max-w-none text-gray-800 mb-4 whitespace-pre-wrap">
        {content}
      </div>

      {mediaUrls && mediaUrls.length > 0 && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {mediaUrls.map((url, index) => (
            <img 
              key={index} 
              src={url} 
              alt={`Post media ${index + 1}`} 
              className="rounded-lg object-cover w-full h-auto max-h-80 shadow-sm"
            />
          ))}
        </div>
      )}

      <footer className="flex justify-between items-center text-sm text-gray-600 pt-4 border-t border-gray-100">
        <button 
          // onClick={handleLike}
          className="flex items-center space-x-1 hover:text-[#F57C00] transition-colors duration-200"
          aria-label={`Like post, current likes: ${likesCount || 0}`}
        >
          {/* Replace with a heart icon */}
          <span>❤️</span> 
          <span>{likesCount || 0} Likes</span>
        </button>
        <span aria-label={`${commentsCount || 0} comments`}>{commentsCount || 0} Comments</span>
      </footer>

      {/* Comment Section */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3 text-gray-700">Comments</h4>
        <CommentList 
          postId={post.postId}
          allianceId={post.allianceId} 
          currentUser={currentUser}
        />
        <CreateCommentForm 
          postId={post.postId} 
          allianceId={post.allianceId} 
          currentUser={currentUser} 
        />
      </div>
    </article>
  );
};

export default PostItem;
