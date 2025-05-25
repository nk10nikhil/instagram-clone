import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    // Get user's following list to exclude from explore
    const user = await db.collection('users').findOne({ _id: userId });
    const following = user?.following || [];
    const excludeUserIds = [userId, ...following];

    // Get posts from users not followed (explore algorithm)
    const posts = await db
      .collection('posts')
      .find({
        userId: { $nin: excludeUserIds },
        isArchived: { $ne: true },
      })
      .sort({ 
        // Simple engagement-based algorithm
        likesCount: -1,
        commentsCount: -1,
        createdAt: -1 
      })
      .limit(50)
      .toArray();

    // Get reels from users not followed
    const reels = await db
      .collection('reels')
      .find({
        userId: { $nin: excludeUserIds },
        isPublic: true,
      })
      .sort({ 
        likesCount: -1,
        viewsCount: -1,
        createdAt: -1 
      })
      .limit(30)
      .toArray();

    // Get user details for posts
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const postUser = await db.collection('users').findOne(
          { _id: post.userId },
          { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
        );

        return {
          ...post,
          user: postUser,
        };
      })
    );

    // Get user details for reels
    const reelsWithUserData = await Promise.all(
      reels.map(async (reel) => {
        const reelUser = await db.collection('users').findOne(
          { _id: reel.userId },
          { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
        );

        return {
          ...reel,
          user: reelUser,
        };
      })
    );

    // Get trending hashtags
    const trendingHashtags = await db
      .collection('posts')
      .aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { tag: '$_id', count: 1, _id: 0 } }
      ])
      .toArray();

    // Get suggested users (users with most followers not followed by current user)
    const suggestedUsers = await db
      .collection('users')
      .find({
        _id: { $nin: excludeUserIds },
      })
      .sort({ followersCount: -1 })
      .limit(20)
      .project({
        username: 1,
        fullName: 1,
        profilePicture: 1,
        isVerified: 1,
        followersCount: { $size: '$followers' },
      })
      .toArray();

    return NextResponse.json({
      posts: postsWithUserData,
      reels: reelsWithUserData,
      trendingHashtags,
      suggestedUsers,
    });
  } catch (error) {
    console.error('Error fetching explore content:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
