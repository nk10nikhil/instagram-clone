'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  XMarkIcon,
  CameraIcon,
  PhotoIcon,
  FaceSmileIcon,
  PaintBrushIcon,
  ChatBubbleBottomCenterTextIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';

export default function CreateStoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [textOverlays, setTextOverlays] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    fontSize: number;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ];

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [session, status, router]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      stopCamera();
    }
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) return;

    const newOverlay = {
      id: Date.now().toString(),
      text: currentText,
      x: 50,
      y: 50,
      color: selectedColor,
      fontSize: 24,
    };

    setTextOverlays(prev => [...prev, newOverlay]);
    setCurrentText('');
    setShowTextEditor(false);
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('caption', caption);
      formData.append('textOverlays', JSON.stringify(textOverlays));

      const response = await fetch('/api/stories', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Failed to upload story');
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      alert('Error uploading story');
    } finally {
      setIsUploading(false);
    }
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
          <h1 className="text-white font-semibold">Create Story</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="h-full flex flex-col">
        {/* Media Area */}
        <div className="flex-1 relative">
          {previewUrl ? (
            /* Preview Mode */
            <div className="relative w-full h-full">
              {selectedFile?.type.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  alt="Story preview"
                />
              )}

              {/* Text Overlays */}
              {textOverlays.map((overlay) => (
                <div
                  key={overlay.id}
                  className="absolute cursor-move"
                  style={{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    color: overlay.color,
                    fontSize: `${overlay.fontSize}px`,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  }}
                  onClick={() => removeTextOverlay(overlay.id)}
                >
                  {overlay.text}
                </div>
              ))}
            </div>
          ) : (
            /* Camera Mode */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                onLoadedMetadata={startCamera}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Tools */}
          {previewUrl && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-4">
              <button
                onClick={() => setShowTextEditor(true)}
                className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
              >
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
              </button>
              <button className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70">
                <PaintBrushIcon className="w-6 h-6" />
              </button>
              <button className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70">
                <FaceSmileIcon className="w-6 h-6" />
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
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 bg-gray-800 text-white rounded-lg"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setPreviewUrl('');
                    setSelectedFile(null);
                    setTextOverlays([]);
                    startCamera();
                  }}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
                >
                  Retake
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {isUploading ? 'Sharing...' : 'Share to Story'}
                </button>
              </div>
            </div>
          ) : (
            /* Camera Controls */
            <div className="flex items-center justify-center space-x-8">
              {/* Gallery */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                <PhotoIcon className="w-6 h-6" />
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white bg-transparent hover:bg-white hover:bg-opacity-20 flex items-center justify-center"
              >
                <CameraIcon className="w-8 h-8 text-white" />
              </button>

              {/* Placeholder for symmetry */}
              <div className="w-12" />
            </div>
          )}
        </div>
      </div>

      {/* Text Editor Modal */}
      {showTextEditor && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-80 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Text</h3>
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Type your text..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
              autoFocus
            />
            
            {/* Color Picker */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Text Color</p>
              <div className="flex space-x-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTextEditor(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={addTextOverlay}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
