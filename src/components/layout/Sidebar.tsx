'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  HeartIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  FilmIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as SearchIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid,
  ChatBubbleLeftIcon as MessageIconSolid,
  FilmIcon as ReelsIconSolid,
} from '@heroicons/react/24/solid';
import { useStore } from '@/store/useStore';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon, activeIcon: HomeIconSolid },
  { name: 'Search', href: '/search', icon: MagnifyingGlassIcon, activeIcon: SearchIconSolid },
  { name: 'Explore', href: '/explore', icon: FilmIcon, activeIcon: ReelsIconSolid },
  { name: 'Reels', href: '/reels', icon: FilmIcon, activeIcon: ReelsIconSolid },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftIcon, activeIcon: MessageIconSolid },
  { name: 'Notifications', href: '/notifications', icon: HeartIcon, activeIcon: HeartIconSolid },
  { name: 'Profile', href: '/profile', icon: UserIcon, activeIcon: UserIconSolid },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setShowCreatePost, unreadCount } = useStore();

  const handleCreatePost = () => {
    setShowCreatePost(true);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-2xl font-bold instagram-gradient bg-clip-text text-transparent">
          Instagram
        </h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = isActive ? item.activeIcon : item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                        isActive
                          ? 'bg-gray-50 text-gray-900'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative">
                        <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name === 'Notifications' && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
              
              {/* Create Post Button */}
              <li>
                <button
                  onClick={handleCreatePost}
                  className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <PlusCircleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  Create
                </button>
              </li>
            </ul>
          </li>
          
          {/* Bottom Section */}
          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              <li>
                <Link
                  href="/settings"
                  className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Cog6ToothIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  Settings
                </Link>
              </li>
              <li>
                <button
                  onClick={handleSignOut}
                  className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  Sign out
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      
      {/* User Profile Section */}
      {session?.user && (
        <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            {session.user.image ? (
              <img
                className="h-8 w-8 rounded-full"
                src={session.user.image}
                alt={session.user.name || ''}
              />
            ) : (
              <UserIcon className="h-5 w-5 text-gray-600" />
            )}
          </div>
          <span className="sr-only">Your profile</span>
          <span aria-hidden="true" className="truncate">
            {session.user.name}
          </span>
        </div>
      )}
    </div>
  );
}
