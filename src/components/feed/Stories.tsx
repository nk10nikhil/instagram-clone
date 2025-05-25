'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useStore } from '@/store/useStore';

interface StoryUser {
  _id: string;
  username: string;
  profilePicture?: string;
  hasStory: boolean;
  isViewed: boolean;
}

export default function Stories() {
  const { data: session } = useSession();
  const { stories, setStories } = useStore();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        setStoryUsers(data.users);
        setStories(data.stories);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStory = () => {
    // TODO: Implement story creation
    console.log('Create story clicked');
  };

  const handleViewStory = (userId: string) => {
    // TODO: Implement story viewer
    console.log('View story for user:', userId);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 post-shadow">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2 flex-shrink-0">
              <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="w-12 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 post-shadow">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex flex-col items-center space-y-2 flex-shrink-0">
          <button
            onClick={handleCreateStory}
            className="relative w-16 h-16 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center hover:border-gray-400 transition-colors"
          >
            <PlusIcon className="w-6 h-6 text-gray-400" />
          </button>
          <span className="text-xs text-gray-600 text-center max-w-[60px] truncate">
            Your story
          </span>
        </div>

        {/* Story Users */}
        {storyUsers.map((user) => (
          <div
            key={user._id}
            className="flex flex-col items-center space-y-2 flex-shrink-0 cursor-pointer"
            onClick={() => handleViewStory(user._id)}
          >
            <div
              className={`story-ring ${
                user.hasStory && !user.isViewed
                  ? 'instagram-gradient'
                  : user.hasStory
                  ? 'bg-gray-300'
                  : 'bg-transparent'
              }`}
            >
              <div className="story-inner">
                <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {user.profilePicture ? (
                    <img
                      className="w-full h-full object-cover"
                      src={user.profilePicture}
                      alt={user.username}
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-600 text-center max-w-[60px] truncate">
              {user.username}
            </span>
          </div>
        ))}

        {/* Show message if no stories */}
        {storyUsers.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-gray-500 text-sm">
              No stories to show. Follow people to see their stories here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
