'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  XMarkIcon,
  VideoCameraIcon,
  PhotoIcon,
  MusicalNoteIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function CreateReelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [session, status, router]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: true,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setRecordedChunks(chunks);
      stopCamera();
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      stopCamera();
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopCamera();
    setTimeout(startCamera, 100);
  };

  const retake = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    setRecordedChunks([]);
    setRecordingTime(0);
    startCamera();
  };

  const handleUpload = async () => {
    if (!previewUrl && !selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('video', selectedFile);
      } else if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        formData.append('video', blob, 'reel.webm');
      }
      
      formData.append('caption', caption);

      const response = await fetch('/api/reels', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        router.push('/reels');
      } else {
        alert('Failed to upload reel');
      }
    } catch (error) {
      console.error('Error uploading reel:', error);
      alert('Error uploading reel');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">Create Reel</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex flex-col">
        {/* Video Area */}
        <div className="flex-1 relative">
          {previewUrl ? (
            /* Preview Mode */
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              controls
              autoPlay
              loop
            />
          ) : (
            /* Camera Mode */
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={startCamera}
            />
          )}

          {/* Recording Timer */}
          {isRecording && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="font-mono">{formatTime(recordingTime)}</span>
              </div>
            </div>
          )}

          {/* Camera Controls */}
          {!previewUrl && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-4">
              <button
                onClick={switchCamera}
                className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
              >
                <ArrowPathIcon className="w-6 h-6" />
              </button>
              <button className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70">
                <SparklesIcon className="w-6 h-6" />
              </button>
              <button className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70">
                <MusicalNoteIcon className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-black">
          {previewUrl ? (
            /* Preview Controls */
            <div className="space-y-4">
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 bg-gray-800 text-white rounded-lg resize-none"
                rows={3}
              />
              <div className="flex space-x-3">
                <button
                  onClick={retake}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
                >
                  Retake
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Share'}
                </button>
              </div>
            </div>
          ) : (
            /* Recording Controls */
            <div className="flex items-center justify-center space-x-8">
              {/* Gallery */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                <PhotoIcon className="w-6 h-6" />
              </button>

              {/* Record Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-transparent hover:bg-white hover:bg-opacity-20'
                }`}
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : (
                  <VideoCameraIcon className="w-8 h-8 text-white" />
                )}
              </button>

              {/* Placeholder for symmetry */}
              <div className="w-12" />
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
