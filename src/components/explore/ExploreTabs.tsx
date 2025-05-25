'use client';

import { 
  Squares2X2Icon, 
  FilmIcon, 
  UserGroupIcon,
  HashtagIcon,
  MapPinIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface ExploreTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ExploreTabs({ activeTab, onTabChange }: ExploreTabsProps) {
  const tabs = [
    { id: 'all', label: 'All', icon: Squares2X2Icon },
    { id: 'reels', label: 'Reels', icon: FilmIcon },
    { id: 'people', label: 'People', icon: UserGroupIcon },
    { id: 'hashtags', label: 'Tags', icon: HashtagIcon },
    { id: 'places', label: 'Places', icon: MapPinIcon },
    { id: 'trending', label: 'Trending', icon: FireIcon },
  ];

  return (
    <div className="bg-white rounded-lg post-shadow">
      <nav className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
