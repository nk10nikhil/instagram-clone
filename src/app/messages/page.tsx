'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import { useStore } from '@/store/useStore';
import { Conversation } from '@/models/Message';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { conversations, activeConversation, setActiveConversation } = useStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/signin');
  }, [session, status, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] bg-white rounded-lg post-shadow overflow-hidden">
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={`${
            isMobile && activeConversation ? 'hidden' : 'block'
          } w-full md:w-1/3 lg:w-1/4 border-r border-gray-200`}>
            <ConversationList />
          </div>

          {/* Chat Window */}
          <div className={`${
            isMobile && !activeConversation ? 'hidden' : 'block'
          } flex-1`}>
            {activeConversation ? (
              <ChatWindow />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Your Messages
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Send private photos and messages to a friend or group.
                  </p>
                  <button
                    onClick={() => {/* TODO: Open new message modal */}}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
