import { ObjectId } from 'mongodb';

export interface Reel {
  _id?: ObjectId;
  userId: ObjectId;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  music?: {
    title: string;
    artist: string;
    url: string;
    duration: number;
  };
  effects?: string[];
  duration: number;
  likes: ObjectId[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  tags: string[];
  mentions: ObjectId[];
  isPublic: boolean;
  allowComments: boolean;
  allowDuet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReelComment {
  _id?: ObjectId;
  reelId: ObjectId;
  userId: ObjectId;
  content: string;
  parentCommentId?: ObjectId;
  likes: ObjectId[];
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}
