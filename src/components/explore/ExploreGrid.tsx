'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon,
  PlayIcon,
  UserGroupIcon,
  HashtagIcon,
  MapPinIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { Post } from '@/models/Post';
import { Reel } from '@/models/Reel';

interface ExploreGridProps {
  posts: Post[];
  reels: Reel[];
  activeTab: string;
}

export default function ExploreGrid({ posts, reels, activeTab }: ExploreGridProps) {
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const renderPostGrid = (items: (Post | Reel)[]) => {
    if (items.length === 0) {
      return (
        <div className="col-span-full text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Squares2X2Icon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Content Found</h3>
          <p className="text-gray-500">Try exploring different categories</p>
        </div>
      );
    }

    return items.map((item, index) => {
      const isReel = 'videoUrl' in item;
      const itemId = item._id?.toString() || '';
      const isHovered = hoveredItem === itemId;

      // Create masonry-like layout with different sizes
      const getGridClass = (index: number) => {
        const patterns = [
          'col-span-1 row-span-1', // Regular
          'col-span-2 row-span-1', // Wide
          'col-span-1 row-span-2', // Tall
          'col-span-2 row-span-2', // Large
        ];
        
        // Use different patterns based on index
        if (index % 7 === 0) return patterns[3]; // Large every 7th
        if (index % 5 === 0) return patterns[2]; // Tall every 5th
        if (index % 3 === 0) return patterns[1]; // Wide every 3rd
        return patterns[0]; // Regular
      };

      return (
        <div
          key={itemId}
          className={`relative bg-gray-200 rounded-lg overflow-hidden cursor-pointer group ${getGridClass(index)}`}
          onMouseEnter={() => setHoveredItem(itemId)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            if (isReel) {
              router.push(`/reels/${itemId}`);
            } else {
              router.push(`/posts/${itemId}`);
            }
          }}
        >
          {/* Media */}
          <div className="w-full h-full relative">
            {isReel ? (
              <>
                <video
                  src={(item as Reel).videoUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
                <div className="absolute top-2 right-2">
                  <PlayIcon className="w-5 h-5 text-white" />
                </div>
              </>
            ) : (
              <img
                src={(item as Post).images?.[0] || ''}
                alt="Post"
                className="w-full h-full object-cover"
              />
            )}

            {/* Multiple images indicator */}
            {!isReel && (item as Post).images && (item as Post).images.length > 1 && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {/* Hover overlay */}
            {isHovered && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-1 text-white">
                  <HeartIcon className="w-5 h-5" />
                  <span className="font-semibold">
                    {isReel ? (item as Reel).likesCount : (item as Post).likesCount}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-white">
                  <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                  <span className="font-semibold">
                    {isReel ? (item as Reel).commentsCount : (item as Post).commentsCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const renderPeopleGrid = () => {
    // Mock suggested people data
    const suggestedPeople = [
      { id: '1', username: 'photographer', fullName: 'John Photographer', followers: '10.2k', image: null },
      { id: '2', username: 'traveler', fullName: 'Jane Traveler', followers: '8.5k', image: null },
      { id: '3', username: 'foodie', fullName: 'Food Lover', followers: '15.3k', image: null },
      { id: '4', username: 'artist', fullName: 'Creative Artist', followers: '5.7k', image: null },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {suggestedPeople.map((person) => (
          <div key={person.id} className="bg-white rounded-lg p-4 post-shadow text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600">
                {person.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{person.username}</h3>
            <p className="text-sm text-gray-500 truncate">{person.fullName}</p>
            <p className="text-xs text-gray-400 mb-3">{person.followers} followers</p>
            <button className="w-full py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">
              Follow
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderHashtagsGrid = () => {
    // Mock trending hashtags
    const trendingHashtags = [
      { tag: 'photography', posts: '2.1M' },
      { tag: 'travel', posts: '1.8M' },
      { tag: 'food', posts: '3.2M' },
      { tag: 'art', posts: '1.5M' },
      { tag: 'nature', posts: '2.7M' },
      { tag: 'fitness', posts: '1.9M' },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {trendingHashtags.map((hashtag) => (
          <div key={hashtag.tag} className="bg-white rounded-lg p-4 post-shadow">
            <div className="flex items-center mb-2">
              <HashtagIcon className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-900">#{hashtag.tag}</h3>
            </div>
            <p className="text-sm text-gray-500">{hashtag.posts} posts</p>
            <div className="mt-3 grid grid-cols-3 gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPlacesGrid = () => {
    // Mock popular places
    const popularPlaces = [
      { name: 'New York City', posts: '5.2M' },
      { name: 'Paris, France', posts: '3.8M' },
      { name: 'Tokyo, Japan', posts: '4.1M' },
      { name: 'London, UK', posts: '3.5M' },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {popularPlaces.map((place) => (
          <div key={place.name} className="bg-white rounded-lg p-4 post-shadow">
            <div className="flex items-center mb-2">
              <MapPinIcon className="w-5 h-5 text-red-500 mr-2" />
              <h3 className="font-semibold text-gray-900 truncate">{place.name}</h3>
            </div>
            <p className="text-sm text-gray-500">{place.posts} posts</p>
            <div className="mt-3 grid grid-cols-3 gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2 auto-rows-max">
            {renderPostGrid([...posts, ...reels])}
          </div>
        );
      case 'reels':
        return (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2 auto-rows-max">
            {renderPostGrid(reels)}
          </div>
        );
      case 'people':
        return renderPeopleGrid();
      case 'hashtags':
        return renderHashtagsGrid();
      case 'places':
        return renderPlacesGrid();
      case 'trending':
        return (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2 auto-rows-max">
            {renderPostGrid([...posts, ...reels].slice(0, 20))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-6">
      {getContent()}
    </div>
  );
}
