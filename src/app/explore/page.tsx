'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ExploreGrid from '@/components/explore/ExploreGrid';
import ExploreTabs from '@/components/explore/ExploreTabs';
import { Post } from '@/models/Post';
import { Reel } from '@/models/Reel';

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    if (session) {
      fetchExploreContent();
    }
  }, [session, status, router]);

  const fetchExploreContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/explore');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
        setReels(data.reels);
      }
    } catch (error) {
      console.error('Error fetching explore content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore</h1>
          <ExploreTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content Grid */}
        <ExploreGrid 
          posts={posts} 
          reels={reels} 
          activeTab={activeTab}
        />
      </div>
    </MainLayout>
  );
}
