import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  fullName: string;
  bio?: string;
  profilePicture?: string;
  isPrivate: boolean;
  followers: ObjectId[];
  following: ObjectId[];
  postsCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date;
  isOnline: boolean;
}

export interface UserProfile {
  _id: ObjectId;
  username: string;
  fullName: string;
  bio?: string;
  profilePicture?: string;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  hasRequestedFollow?: boolean;
}
