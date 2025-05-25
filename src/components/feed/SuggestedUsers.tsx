'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/models/User';

export default function SuggestedUsers() {
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const response = await fetch('/api/users/suggested');
      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove user from suggestions after following
        setSuggestedUsers(prev => prev.filter(user => user._id.toString() !== userId));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 post-shadow">
        <h3 className="font-semibold text-gray-900 mb-4">Suggested for you</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-16 h-6 bg-gray-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestedUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-4 post-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Suggested for you</h3>
        <Link
          href="/explore/people"
          className="text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          See All
        </Link>
      </div>
      
      <div className="space-y-3">
        {suggestedUsers.slice(0, 5).map((user) => (
          <div key={user._id.toString()} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href={`/profile/${user.username}`}>
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {user.profilePicture ? (
                    <img
                      className="w-full h-full object-cover"
                      src={user.profilePicture}
                      alt={user.username}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${user.username}`}>
                  <h4 className="font-semibold text-gray-900 text-sm hover:underline truncate">
                    {user.username}
                  </h4>
                </Link>
                <p className="text-xs text-gray-500 truncate">
                  {user.fullName}
                </p>
                {user.followersCount > 0 && (
                  <p className="text-xs text-gray-400">
                    {user.followersCount} followers
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleFollow(user._id.toString())}
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex flex-wrap gap-2">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/help" className="hover:underline">Help</Link>
            <Link href="/press" className="hover:underline">Press</Link>
            <Link href="/api" className="hover:underline">API</Link>
            <Link href="/jobs" className="hover:underline">Jobs</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
          <p className="mt-2">© 2024 Instagram Clone</p>
        </div>
      </div>
    </div>
  );
}
