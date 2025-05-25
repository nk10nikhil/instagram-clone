import { ObjectId } from 'mongodb';

export interface Post {
  _id?: ObjectId;
  userId: ObjectId;
  caption?: string;
  images: string[];
  videos?: string[];
  location?: string;
  tags: string[];
  mentions: ObjectId[];
  likes: ObjectId[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isArchived: boolean;
  commentsDisabled: boolean;
  hideLikeCount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id?: ObjectId;
  postId: ObjectId;
  userId: ObjectId;
  content: string;
  parentCommentId?: ObjectId;
  likes: ObjectId[];
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  _id?: ObjectId;
  userId: ObjectId;
  media: string;
  mediaType: 'image' | 'video';
  caption?: string;
  viewers: ObjectId[];
  viewsCount: number;
  expiresAt: Date;
  createdAt: Date;
}
