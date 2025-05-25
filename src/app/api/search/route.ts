import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [], posts: [] });
    }

    const db = await getDatabase();

    // Search users
    const users = await db
      .collection('users')
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } },
        ],
      })
      .project({
        username: 1,
        fullName: 1,
        profilePicture: 1,
        isVerified: 1,
        followersCount: { $size: '$followers' },
      })
      .limit(20)
      .toArray();

    // Search posts by hashtags
    const posts = await db
      .collection('posts')
      .find({
        $or: [
          { tags: { $regex: query.replace('#', ''), $options: 'i' } },
          { caption: { $regex: query, $options: 'i' } },
        ],
        isArchived: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Get user details for posts
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const user = await db.collection('users').findOne(
          { _id: post.userId },
          { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
        );
        return { ...post, user };
      })
    );

    return NextResponse.json({
      users,
      posts: postsWithUserData,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
