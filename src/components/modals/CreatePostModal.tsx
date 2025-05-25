'use client';

import { useState, useRef } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useStore } from '@/store/useStore';

export default function CreatePostModal() {
  const { setShowCreatePost, addPost } = useStore();
  const [step, setStep] = useState(1); // 1: Select files, 2: Edit, 3: Share
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setShowCreatePost(false);
    setStep(1);
    setSelectedFiles([]);
    setPreviews([]);
    setCaption('');
    setLocation('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(files);
    
    // Create previews
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === files.length) {
          setPreviews(newPreviews);
          setStep(2);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleShare = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('caption', caption);
      formData.append('location', location);

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        addPost(data.post);
        handleClose();
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {step === 1 ? 'Create new post' : step === 2 ? 'Edit' : 'Share'}
            </h3>
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="text-blue-500 font-semibold hover:text-blue-600"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleShare}
                disabled={isUploading}
                className="text-blue-500 font-semibold hover:text-blue-600 disabled:opacity-50"
              >
                {isUploading ? 'Sharing...' : 'Share'}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {step === 1 && (
              <div className="text-center py-12">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Drag photos and videos here
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Select from your computer
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Select from computer
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {step === 2 && previews.length > 0 && (
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previews[0]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                {previews.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {previews.slice(1).map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 2}`}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={previews[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      placeholder="Write a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={4}
                      className="w-full text-sm border-none outline-none resize-none placeholder-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Add location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-sm border-none outline-none placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
