'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import { Reel } from '@/models/Reel';

interface ReelPlayerProps {
  reel: Reel;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export default function ReelPlayer({ 
  reel, 
  isActive, 
  onNext, 
  onPrevious, 
  canGoNext, 
  canGoPrevious 
}: ReelPlayerProps) {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(
    reel.likes.some(like => like.toString() === session?.user?.id)
  );
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      if (canGoNext) {
        onNext();
      } else {
        video.currentTime = 0;
        video.play();
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, [canGoNext, onNext]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/reels/${reel._id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
      }
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/reels/${reel._id}/save`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.isSaved);
      }
    } catch (error) {
      console.error('Error saving reel:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this reel',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600 bg-opacity-50">
        <div 
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="p-4 bg-black bg-opacity-50 rounded-full text-white"
          >
            <PlayIcon className="w-12 h-12" />
          </button>
        </div>
      )}

      {/* Navigation areas */}
      <div className="absolute inset-0 flex">
        {/* Previous area */}
        <div 
          className="flex-1 cursor-pointer"
          onClick={canGoPrevious ? onPrevious : undefined}
        />
        {/* Next area */}
        <div 
          className="flex-1 cursor-pointer"
          onClick={canGoNext ? onNext : undefined}
        />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-transparent to-transparent">
        <div className="flex items-end justify-between">
          {/* Left side - User info and caption */}
          <div className="flex-1 mr-4">
            <div className="flex items-center mb-2">
              <Link href={`/profile/${reel.userId}`}>
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  <span className="text-sm font-semibold text-gray-600">U</span>
                </div>
              </Link>
              <Link href={`/profile/${reel.userId}`}>
                <span className="text-white font-semibold">username</span>
              </Link>
              <button className="ml-3 px-4 py-1 border border-white text-white text-sm rounded-md hover:bg-white hover:text-black transition-colors">
                Follow
              </button>
            </div>

            {reel.caption && (
              <p className="text-white text-sm mb-2 line-clamp-2">
                {reel.caption}
              </p>
            )}

            {reel.music && (
              <div className="flex items-center text-white text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <span>{reel.music.title} • {reel.music.artist}</span>
              </div>
            )}

            <p className="text-gray-300 text-xs mt-2">
              {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
            </p>
          </div>

          {/* Right side - Actions */}
          <div className="flex flex-col items-center space-y-4">
            {/* Like */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleLike}
                className={`p-3 rounded-full transition-colors ${
                  isLiked ? 'text-red-500' : 'text-white hover:text-red-500'
                }`}
              >
                {isLiked ? (
                  <HeartIconSolid className="w-7 h-7" />
                ) : (
                  <HeartIcon className="w-7 h-7" />
                )}
              </button>
              <span className="text-white text-xs">{reel.likesCount}</span>
            </div>

            {/* Comment */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowComments(true)}
                className="p-3 text-white hover:text-gray-300 transition-colors"
              >
                <ChatBubbleOvalLeftIcon className="w-7 h-7" />
              </button>
              <span className="text-white text-xs">{reel.commentsCount}</span>
            </div>

            {/* Share */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleShare}
                className="p-3 text-white hover:text-gray-300 transition-colors"
              >
                <PaperAirplaneIcon className="w-7 h-7" />
              </button>
              <span className="text-white text-xs">{reel.sharesCount}</span>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              className={`p-3 transition-colors ${
                isSaved ? 'text-yellow-500' : 'text-white hover:text-yellow-500'
              }`}
            >
              {isSaved ? (
                <BookmarkIconSolid className="w-7 h-7" />
              ) : (
                <BookmarkIcon className="w-7 h-7" />
              )}
            </button>

            {/* More */}
            <button className="p-3 text-white hover:text-gray-300 transition-colors">
              <EllipsisHorizontalIcon className="w-7 h-7" />
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              className="p-3 text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-6 h-6" />
              ) : (
                <SpeakerWaveIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
          <div className="w-full bg-white rounded-t-lg max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-500 text-center">No comments yet</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
