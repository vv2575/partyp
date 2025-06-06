'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { listenToAlliancePosts, createAlliancePost } from '@/firebase/allianceService'; // Assuming createAlliancePost is here
import type { AlliancePost } from '@/types/alliance';
import type { User } from '@/types/user'; // For currentUser prop
import PostItem from './PostItem'; // Import PostItem
import CreatePostForm from './CreatePostForm'; // Import CreatePostForm
// import { Timestamp } from 'firebase/firestore'; // If needed for post creation

interface PostListProps {
  allianceId: string;
  currentUser?: User | null; // Optional: current logged-in user
  userPrimaryCommunityId?: string | null; // Optional: ID of the user's primary community
}

const PostList: React.FC<PostListProps> = ({ allianceId, currentUser, userPrimaryCommunityId }) => {
  const [posts, setPosts] = useState<AlliancePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allianceId) {
      setLoading(false);
      setError('Alliance ID is missing.');
      return;
    }

    setLoading(true);
    const unsubscribe = listenToAlliancePosts(allianceId, (updatedPosts) => {
      setPosts(updatedPosts);
      setLoading(false);
      setError(null);
    }, (err: Error) => {
      console.error('Error listening to posts:', err);
      setError('Failed to load posts in real-time.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allianceId]);

  // Callback for CreatePostForm submission - this is now handled within CreatePostForm itself.
  // If you need to refresh the list or perform actions after post creation *here*,
  // CreatePostForm could accept an onPostCreated callback.
  // For now, the real-time listener should pick up new posts automatically.

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {currentUser && userPrimaryCommunityId && (
        <CreatePostForm 
          allianceId={allianceId} 
          currentUser={currentUser} 
          userPrimaryCommunityId={userPrimaryCommunityId} 
        />
      )}
      {!currentUser && (
        <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg border border-blue-300" role="alert">
          <p className="font-medium">Please log in to create a post.</p>
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-lg">No posts in this alliance yet.</p>
          {currentUser && userPrimaryCommunityId && (
            <p className="text-gray-400 mt-2">Be the first to start a discussion!</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {posts.map(post => (
          <PostItem 
            key={post.postId} 
            post={post} 
            currentUser={currentUser === undefined ? null : currentUser} 
            // userPrimaryCommunityId={userPrimaryCommunityId} // Pass if PostItem needs it directly for comments or likes context
          />
        ))}
      </div>
    </div>
  );
};

export default PostList;
