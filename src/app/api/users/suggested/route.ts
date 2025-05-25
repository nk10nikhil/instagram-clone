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

    // Get current user's following list
    const currentUser = await db.collection('users').findOne({ _id: userId });
    const following = currentUser?.following || [];

    // Get users that the current user is not following
    const suggestedUsers = await db
      .collection('users')
      .find({
        _id: { $nin: [userId, ...following] },
      })
      .project({
        username: 1,
        fullName: 1,
        profilePicture: 1,
        isVerified: 1,
        followersCount: { $size: '$followers' },
      })
      .sort({ followersCount: -1 }) // Sort by popularity
      .limit(10)
      .toArray();

    return NextResponse.json({ users: suggestedUsers });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
