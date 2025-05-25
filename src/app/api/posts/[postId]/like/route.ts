import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;
    const userId = new ObjectId(session.user.id);
    const postObjectId = new ObjectId(postId);

    const db = await getDatabase();

    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: postObjectId });
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Check if user already liked the post
    const isLiked = post.likes.some((like: ObjectId) => like.equals(userId));

    let updateOperation;
    let newLikesCount;

    if (isLiked) {
      // Unlike the post
      updateOperation = {
        $pull: { likes: userId },
        $inc: { likesCount: -1 },
      };
      newLikesCount = post.likesCount - 1;
    } else {
      // Like the post
      updateOperation = {
        $addToSet: { likes: userId },
        $inc: { likesCount: 1 },
      };
      newLikesCount = post.likesCount + 1;
    }

    // Update the post
    await db.collection('posts').updateOne(
      { _id: postObjectId },
      updateOperation
    );

    // Get updated likes array
    const updatedPost = await db.collection('posts').findOne({ _id: postObjectId });

    return NextResponse.json({
      isLiked: !isLiked,
      likesCount: newLikesCount,
      likes: updatedPost?.likes || [],
    });
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
