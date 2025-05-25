'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ReelPlayer from '@/components/reels/ReelPlayer';
import { Reel } from '@/models/Reel';

export default function ReelsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    if (session) {
      fetchReels();
    }
  }, [session, status, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length]);

  const fetchReels = async () => {
    try {
      const response = await fetch('/api/reels');
      if (response.ok) {
        const data = await response.json();
        setReels(data.reels);
      }
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (direction === 'down' && currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (reels.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Reels Yet</h3>
            <p className="text-gray-400 mb-4">Start creating reels to see them here</p>
            <button
              onClick={() => router.push('/reels/create')}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:opacity-90"
            >
              Create Reel
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Mobile-first full-screen reels */}
      <div 
        ref={containerRef}
        className="h-full overflow-hidden relative"
      >
        {reels.map((reel, index) => (
          <div
            key={reel._id?.toString()}
            className={`absolute inset-0 transition-transform duration-300 ${
              index === currentIndex 
                ? 'translate-y-0' 
                : index < currentIndex 
                  ? '-translate-y-full' 
                  : 'translate-y-full'
            }`}
          >
            <ReelPlayer
              reel={reel}
              isActive={index === currentIndex}
              onNext={() => handleScroll('down')}
              onPrevious={() => handleScroll('up')}
              canGoNext={currentIndex < reels.length - 1}
              canGoPrevious={currentIndex > 0}
            />
          </div>
        ))}
      </div>

      {/* Navigation indicators */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-2 z-20">
        {reels.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-8 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-20 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
