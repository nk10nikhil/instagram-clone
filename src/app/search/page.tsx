'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layout/MainLayout';
import { UserProfile } from '@/models/User';

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [recentSearches, setRecentSearches] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUserClick = (user: UserProfile) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(u => u._id !== user._id);
      return [user, ...filtered].slice(0, 10);
    });

    // Navigate to user profile
    router.push(`/profile/${user.username}`);
  };

  const removeFromRecent = (userId: string) => {
    setRecentSearches(prev => prev.filter(u => u._id.toString() !== userId));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg post-shadow">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-lg border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((user) => (
                    <div
                      key={user._id.toString()}
                      onClick={() => handleUserClick(user)}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.username}
                          {user.isVerified && (
                            <span className="ml-1 text-blue-500">✓</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {user.fullName}
                        </p>
                        {user.followersCount > 0 && (
                          <p className="text-xs text-gray-400">
                            {user.followersCount} followers
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )
            ) : (
              /* Recent Searches */
              <div className="p-4">
                {recentSearches.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Recent</h3>
                      <button
                        onClick={() => setRecentSearches([])}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((user) => (
                        <div
                          key={user._id.toString()}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <div
                            onClick={() => handleUserClick(user)}
                            className="flex items-center space-x-3 flex-1 cursor-pointer"
                          >
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
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {user.username}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {user.fullName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromRecent(user._id.toString())}
                            className="p-1 hover:bg-gray-200 rounded-full"
                          >
                            <XMarkIcon className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">Search for people</h3>
                    <p className="text-sm">Find friends and discover new accounts</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
