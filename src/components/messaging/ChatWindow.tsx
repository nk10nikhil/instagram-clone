'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import {
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  FaceSmileIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '@/store/useStore';
import { Message } from '@/models/Message';
import SocketManager from '@/lib/socket';

export default function ChatWindow() {
  const { data: session } = useSession();
  const { activeConversation, setActiveConversation, messages, setMessages, addMessage } = useStore();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const recordingTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (activeConversation) {
      fetchMessages();
      setupSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!activeConversation) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/conversations/${activeConversation._id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socketManager = SocketManager.getInstance();
    const socket = socketManager.getSocket();

    if (socket && activeConversation) {
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('message_read', handleMessageRead);

      // Join conversation room
      socket.emit('join_conversation', activeConversation._id);
    }
  };

  const cleanupSocketListeners = () => {
    const socketManager = SocketManager.getInstance();
    const socket = socketManager.getSocket();

    if (socket) {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_read', handleMessageRead);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (message.conversationId.toString() === activeConversation?._id?.toString()) {
      addMessage(message);

      // Mark message as read if it's not from current user
      if (message.senderId.toString() !== session?.user?.id) {
        markAsRead(message._id!.toString());
      }
    }
  };

  const handleUserTyping = ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
    if (userId !== session?.user?.id) {
      setTypingUsers(prev => {
        if (typing) {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    }
  };

  const handleMessageRead = ({ messageId, userId }: { messageId: string; userId: string }) => {
    // Update message read status in UI
    console.log('Message read:', messageId, userId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const socketManager = SocketManager.getInstance();
    const socket = socketManager.getSocket();

    if (socket) {
      socket.emit('send_message', {
        conversationId: activeConversation._id,
        senderId: session?.user?.id,
        content: newMessage.trim(),
        messageType: 'text',
      });

      setNewMessage('');
      stopTyping();
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    const socketManager = SocketManager.getInstance();
    const socket = socketManager.getSocket();

    if (socket && activeConversation) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing_start', {
          conversationId: activeConversation._id,
          userId: session?.user?.id,
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    }
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      const socketManager = SocketManager.getInstance();
      const socket = socketManager.getSocket();

      if (socket && activeConversation) {
        socket.emit('typing_stop', {
          conversationId: activeConversation._id,
          userId: session?.user?.id,
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const markAsRead = async (messageId: string) => {
    const socketManager = SocketManager.getInstance();
    const socket = socketManager.getSocket();

    if (socket) {
      socket.emit('mark_as_read', {
        messageId,
        userId: session?.user?.id,
      });
    }
  };

  const handleVoiceCall = () => {
    // TODO: Implement voice call
    console.log('Voice call initiated');
  };

  const handleVideoCall = () => {
    // TODO: Implement video call
    console.log('Video call initiated');
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        sendVoiceMessage(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    const socketManager = SocketManager.getInstance();
    const socket = socketManager.getSocket();

    if (socket && activeConversation) {
      // Convert blob to base64 for demo (in production, upload to cloud)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;

        socket.emit('send_message', {
          conversationId: activeConversation._id,
          senderId: session?.user?.id,
          content: '',
          messageType: 'audio',
          media: base64Audio,
        });
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        // Update message reactions in UI
        console.log('Reaction added');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeConversation) return null;

  const otherParticipant = activeConversation.participants.find(
    p => p._id !== session?.user?.id
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-1 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
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

          <div>
            <h3 className="font-semibold">
              {activeConversation.isGroup
                ? activeConversation.groupName
                : otherParticipant?.username || 'Unknown'
              }
            </h3>
            {otherParticipant?.isOnline && (
              <p className="text-sm text-green-500">Active now</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleVoiceCall}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleVideoCall}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-200'
                  } animate-pulse`}>
                  <div className="w-24 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.senderId.toString() === session?.user?.id;

              return (
                <div
                  key={message._id?.toString()}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                      }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <PhotoIcon className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-full outline-none focus:border-blue-500"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <FaceSmileIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {newMessage.trim() ? (
            <button
              type="submit"
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <span className="text-sm text-gray-500">👍</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
