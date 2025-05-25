'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Cog6ToothIcon, 
  UserPlusIcon, 
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon 
} from '@heroicons/react/24/outline';
import { User } from '@/models/User';

interface ProfileHeaderProps {
  user: User;
  postsCount: number;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({ user, postsCount, isOwnProfile = true }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(user.followers?.length || 0);

  const handleFollow = async () => {
    try {
      const response = await fetch(`/api/users/${user._id}/follow`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleMessage = () => {
    // TODO: Create conversation and redirect to messages
    console.log('Message user');
  };

  return (
    <div className="bg-white rounded-lg p-6 post-shadow mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
        {/* Profile Picture */}
        <div className="flex justify-center md:justify-start mb-6 md:mb-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            {user.profilePicture ? (
              <img
                className="w-full h-full object-cover"
                src={user.profilePicture}
                alt={user.username}
              />
            ) : (
              <span className="text-4xl md:text-5xl font-semibold text-gray-600">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          {/* Username and Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
            <h1 className="text-2xl font-light mb-4 md:mb-0">
              {user.username}
              {user.isVerified && (
                <span className="ml-2 text-blue-500">✓</span>
              )}
            </h1>

            <div className="flex justify-center md:justify-start space-x-2">
              {isOwnProfile ? (
                <>
                  <button className="px-4 py-1.5 bg-gray-100 text-gray-900 font-semibold rounded-md hover:bg-gray-200 transition-colors">
                    Edit profile
                  </button>
                  <button className="p-1.5 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors">
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-1.5 font-semibold rounded-md transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="px-4 py-1.5 bg-gray-100 text-gray-900 font-semibold rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Message
                  </button>
                  <button className="p-1.5 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors">
                    <UserPlusIcon className="w-5 h-5" />
                  </button>
                  <button className="p-1.5 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors">
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center md:justify-start space-x-8 mb-4">
            <div className="text-center">
              <span className="font-semibold">{postsCount}</span>
              <span className="text-gray-600 ml-1">posts</span>
            </div>
            <div className="text-center">
              <span className="font-semibold">{followersCount}</span>
              <span className="text-gray-600 ml-1">followers</span>
            </div>
            <div className="text-center">
              <span className="font-semibold">{user.following?.length || 0}</span>
              <span className="text-gray-600 ml-1">following</span>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <h2 className="font-semibold">{user.fullName}</h2>
            {user.bio && (
              <p className="text-gray-700 whitespace-pre-line">{user.bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
