'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useStore } from '@/store/useStore';
import { Conversation } from '@/models/Message';
import SocketManager from '@/lib/socket';

export default function ConversationList() {
  const { data: session } = useSession();
  const { conversations, setConversations, activeConversation, setActiveConversation } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // Listen for new messages
    const socketManager = SocketManager.getInstance();
    const socket = socketManager.getSocket();

    if (socket) {
      socket.on('new_message', (message) => {
        // Update conversation list when new message arrives
        fetchConversations();
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.participants.some(participant =>
      participant.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <PencilSquareIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <PencilSquareIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'No conversations found' : 'No messages yet'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                p => p._id !== session?.user?.id
              );
              const isActive = activeConversation?._id === conversation._id;
              const unreadCount = conversation.unreadCount?.[session?.user?.id || ''] || 0;

              return (
                <div
                  key={conversation._id?.toString()}
                  onClick={() => handleConversationClick(conversation)}
                  className={`flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer ${
                    isActive ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {otherParticipant?.profilePicture ? (
                        <img
                          className="w-full h-full object-cover"
                          src={otherParticipant.profilePicture}
                          alt={otherParticipant.username}
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-600">
                          {otherParticipant?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    {otherParticipant?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm truncate ${
                        unreadCount > 0 ? 'font-semibold' : 'font-medium'
                      }`}>
                        {conversation.isGroup 
                          ? conversation.groupName 
                          : otherParticipant?.username || 'Unknown'
                        }
                      </h3>
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-sm text-gray-500 truncate ${
                        unreadCount > 0 ? 'font-medium text-gray-900' : ''
                      }`}>
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
