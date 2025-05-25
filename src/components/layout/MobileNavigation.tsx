'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as SearchIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import { useStore } from '@/store/useStore';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, activeIcon: HomeIconSolid },
  { name: 'Search', href: '/search', icon: MagnifyingGlassIcon, activeIcon: SearchIconSolid },
  { name: 'Create', href: '#', icon: PlusCircleIcon, activeIcon: PlusCircleIcon, isButton: true },
  { name: 'Notifications', href: '/notifications', icon: HeartIcon, activeIcon: HeartIconSolid },
  { name: 'Profile', href: '/profile', icon: UserIcon, activeIcon: UserIconSolid },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const { setShowCreatePost, unreadCount } = useStore();

  const handleCreatePost = () => {
    setShowCreatePost(true);
  };

  return (
    <>
      {/* Top Header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6">
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-xl font-bold instagram-gradient bg-clip-text text-transparent">
            Instagram
          </h1>
          <div className="flex items-center gap-x-4">
            <Link
              href="/messages"
              className="text-gray-700 hover:text-gray-900"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <nav className="flex">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.activeIcon : item.icon;

            if (item.isButton) {
              return (
                <button
                  key={item.name}
                  onClick={handleCreatePost}
                  className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-gray-700 hover:text-gray-900"
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-16" />
    </>
  );
}
