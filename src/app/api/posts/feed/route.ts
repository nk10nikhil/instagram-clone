import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Post } from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    // Get user's following list
    const user = await db.collection('users').findOne({ _id: userId });
    const following = user?.following || [];

    // Include user's own posts in the feed
    const feedUserIds = [userId, ...following];

    // Get posts from followed users and own posts
    const posts = await db
      .collection<Post>('posts')
      .find({
        userId: { $in: feedUserIds },
        isArchived: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Get user details for each post
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

    return NextResponse.json({
      posts: postsWithUserData,
      hasMore: posts.length === 20,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
