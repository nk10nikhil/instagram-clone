import { ObjectId } from 'mongodb';

export interface BlockedUser {
  _id?: ObjectId;
  userId: ObjectId; // User who blocked
  blockedUserId: ObjectId; // User who was blocked
  reason?: string;
  createdAt: Date;
}

export interface Report {
  _id?: ObjectId;
  reporterId: ObjectId; // User who reported
  reportedUserId?: ObjectId; // User being reported
  reportedPostId?: ObjectId; // Post being reported
  reportedCommentId?: ObjectId; // Comment being reported
  type: 'user' | 'post' | 'comment' | 'story' | 'message';
  reason: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'nudity' | 'false_information' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacySettings {
  _id?: ObjectId;
  userId: ObjectId;
  isPrivateAccount: boolean;
  allowTagging: 'everyone' | 'followers' | 'no_one';
  allowMentions: 'everyone' | 'followers' | 'no_one';
  allowComments: 'everyone' | 'followers' | 'no_one';
  allowDirectMessages: 'everyone' | 'followers' | 'no_one';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showReadReceipts: boolean;
  allowStoryReplies: boolean;
  allowStorySharing: boolean;
  hideStoryFrom: ObjectId[];
  restrictedUsers: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowRequest {
  _id?: ObjectId;
  fromUserId: ObjectId;
  toUserId: ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}
