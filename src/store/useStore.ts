import { create } from 'zustand';
import { User, UserProfile } from '@/models/User';
import { Post } from '@/models/Post';
import { Conversation, Message } from '@/models/Message';

interface AppState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Posts state
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  
  // Stories state
  stories: any[];
  setStories: (stories: any[]) => void;
  
  // Messages state
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showCreatePost: boolean;
  setShowCreatePost: (show: boolean) => void;
  showStoryViewer: boolean;
  setShowStoryViewer: (show: boolean) => void;
  
  // Search state
  searchResults: UserProfile[];
  setSearchResults: (results: UserProfile[]) => void;
  
  // Notifications state
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // User state
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  // Posts state
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map((post) =>
      post._id?.toString() === postId ? { ...post, ...updates } : post
    ),
  })),
  
  // Stories state
  stories: [],
  setStories: (stories) => set({ stories }),
  
  // Messages state
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  activeConversation: null,
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  // UI state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  showCreatePost: false,
  setShowCreatePost: (show) => set({ showCreatePost: show }),
  showStoryViewer: false,
  setShowStoryViewer: (show) => set({ showStoryViewer: show }),
  
  // Search state
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  
  // Notifications state
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
