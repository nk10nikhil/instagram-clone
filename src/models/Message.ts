import { ObjectId } from 'mongodb';

export interface Message {
  _id?: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  content?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'post' | 'story' | 'call';
  media?: string;
  postId?: ObjectId;
  storyId?: ObjectId;
  callData?: CallData;
  reactions: MessageReaction[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  readBy: MessageRead[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  _id?: ObjectId;
  participants: ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
  groupAdmins?: ObjectId[];
  lastMessage?: ObjectId;
  lastMessageAt?: Date;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  userId: ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface MessageRead {
  userId: ObjectId;
  readAt: Date;
}

export interface CallData {
  type: 'voice' | 'video';
  duration?: number;
  status: 'missed' | 'answered' | 'declined';
  participants: ObjectId[];
}
