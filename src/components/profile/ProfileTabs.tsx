'use client';

import { useState } from 'react';
import { 
  Squares2X2Icon, 
  FilmIcon, 
  BookmarkIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';
import { Post } from '@/models/Post';

interface ProfileTabsProps {
  posts: Post[];
}

export default function ProfileTabs({ posts }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('posts');

  const tabs = [
    { id: 'posts', label: 'POSTS', icon: Squares2X2Icon },
    { id: 'reels', label: 'REELS', icon: FilmIcon },
    { id: 'saved', label: 'SAVED', icon: BookmarkIcon },
    { id: 'tagged', label: 'TAGGED', icon: UserIcon },
  ];

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Squares2X2Icon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Posts Yet</h3>
          <p className="text-gray-500">When you share photos, they'll appear on your profile.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {posts.map((post) => (
          <div
            key={post._id?.toString()}
            className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
          >
            {post.images && post.images.length > 0 ? (
              <img
                className="w-full h-full object-cover"
                src={post.images[0]}
                alt="Post"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            {/* Multiple images indicator */}
            {post.images && post.images.length > 1 && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPosts();
      case 'reels':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <FilmIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reels Yet</h3>
            <p className="text-gray-500">When you share reels, they'll appear on your profile.</p>
          </div>
        );
      case 'saved':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <BookmarkIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Posts</h3>
            <p className="text-gray-500">Save posts you want to see again.</p>
          </div>
        );
      case 'tagged':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tagged Posts</h3>
            <p className="text-gray-500">When people tag you in photos, they'll appear here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg post-shadow overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
}
