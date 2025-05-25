import { ObjectId } from 'mongodb';

export interface Notification {
  _id?: ObjectId;
  userId: ObjectId; // User who receives the notification
  fromUserId: ObjectId; // User who triggered the notification
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention' | 'story_view' | 'message' | 'call';
  entityId?: ObjectId; // Post, comment, story, etc.
  entityType?: 'post' | 'comment' | 'story' | 'reel' | 'message';
  content?: string; // Additional content like comment text
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  _id?: ObjectId;
  userId: ObjectId;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  directMessages: boolean;
  videoChats: boolean;
  liveVideos: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}
