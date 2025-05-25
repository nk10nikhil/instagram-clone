'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Stories from './Stories';
import PostCard from './PostCard';
import SuggestedUsers from './SuggestedUsers';
import { useStore } from '@/store/useStore';
import { Post } from '@/models/Post';

export default function Feed() {
  const { data: session } = useSession();
  const { posts, setPosts, isLoading, setIsLoading } = useStore();
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/posts/feed');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      } else {
        setError('Failed to load posts');
      }
    } catch (error) {
      setError('An error occurred while loading posts');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Stories skeleton */}
          <div className="bg-white rounded-lg p-4 post-shadow">
            <div className="flex space-x-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                  <div className="w-12 h-3 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Posts skeleton */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg post-shadow">
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="w-full h-96 bg-gray-300"></div>
              <div className="p-4 space-y-3">
                <div className="flex space-x-4">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
                <div className="w-full h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Stories */}
            <Stories />
            
            {/* Posts */}
            {error ? (
              <div className="bg-white rounded-lg p-8 text-center post-shadow">
                <p className="text-gray-500">{error}</p>
                <button
                  onClick={fetchPosts}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center post-shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to Instagram!
                </h3>
                <p className="text-gray-500 mb-4">
                  Start following people to see their posts in your feed.
                </p>
                <button
                  onClick={() => window.location.href = '/explore'}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Explore People
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id?.toString()} post={post} />
              ))
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            {/* User Profile Card */}
            {session?.user && (
              <div className="bg-white rounded-lg p-4 post-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center">
                    {session.user.image ? (
                      <img
                        className="w-14 h-14 rounded-full object-cover"
                        src={session.user.image}
                        alt={session.user.name || ''}
                      />
                    ) : (
                      <span className="text-xl font-semibold text-gray-600">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {session.user.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      @{(session.user as any).username || 'username'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Suggested Users */}
            <SuggestedUsers />
          </div>
        </div>
      </div>
    </div>
  );
}
