'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import { Post } from '@/models/Post';
import { useStore } from '@/store/useStore';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const { updatePost } = useStore();
  const [isLiked, setIsLiked] = useState(
    post.likes.some(like => like.toString() === session?.user?.id)
  );
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        updatePost(post._id!.toString(), {
          likes: data.likes,
          likesCount: data.likesCount,
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/save`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.isSaved);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        setComment('');
        // Refresh comments or update state
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="bg-white rounded-lg post-shadow overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.userId}`}>
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">
                U
              </span>
            </div>
          </Link>
          <div>
            <Link href={`/profile/${post.userId}`}>
              <h3 className="font-semibold text-gray-900 hover:underline">
                username
              </h3>
            </Link>
            {post.location && (
              <p className="text-sm text-gray-500">{post.location}</p>
            )}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="relative">
          <img
            className="w-full h-96 object-cover"
            src={post.images[0]}
            alt="Post content"
          />
          {post.images.length > 1 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
              1/{post.images.length}
            </div>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-6 h-6" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-gray-700 hover:text-gray-900"
            >
              <ChatBubbleOvalLeftIcon className="w-6 h-6" />
            </button>
            <button className="text-gray-700 hover:text-gray-900">
              <PaperAirplaneIcon className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className={`transition-colors ${
              isSaved ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            {isSaved ? (
              <BookmarkIconSolid className="w-6 h-6" />
            ) : (
              <BookmarkIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Likes Count */}
        {post.likesCount > 0 && (
          <p className="font-semibold text-gray-900 mb-2">
            {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <span className="font-semibold text-gray-900 mr-2">username</span>
            <span className="text-gray-900">{post.caption}</span>
          </div>
        )}

        {/* Comments Count */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-gray-500 text-sm mb-2 hover:underline"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-gray-400 text-xs uppercase">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>

        {/* Comment Form */}
        <form onSubmit={handleComment} className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              {session?.user?.image ? (
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  src={session.user.image}
                  alt=""
                />
              ) : (
                <span className="text-xs font-semibold text-gray-600">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 text-sm border-none outline-none placeholder-gray-400"
            />
            {comment.trim() && (
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50"
              >
                Post
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
