import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Comment } from '@/models/Post';

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const postObjectId = new ObjectId(postId);

    const db = await getDatabase();

    // Get comments for the post
    const comments = await db
      .collection<Comment>('comments')
      .find({ postId: postObjectId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get user details for each comment
    const commentsWithUserData = await Promise.all(
      comments.map(async (comment) => {
        const user = await db.collection('users').findOne(
          { _id: comment.userId },
          { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
        );

        return {
          ...comment,
          user,
        };
      })
    );

    return NextResponse.json({ comments: commentsWithUserData });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { content, parentCommentId } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }

    const userId = new ObjectId(session.user.id);
    const postObjectId = new ObjectId(postId);

    const db = await getDatabase();

    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: postObjectId });
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Create comment
    const newComment: Omit<Comment, '_id'> = {
      postId: postObjectId,
      userId,
      content: content.trim(),
      parentCommentId: parentCommentId ? new ObjectId(parentCommentId) : undefined,
      likes: [],
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Comment>('comments').insertOne(newComment);

    // Update post comments count
    await db.collection('posts').updateOne(
      { _id: postObjectId },
      { $inc: { commentsCount: 1 } }
    );

    // If this is a reply, update parent comment replies count
    if (parentCommentId) {
      await db.collection('comments').updateOne(
        { _id: new ObjectId(parentCommentId) },
        { $inc: { repliesCount: 1 } }
      );
    }

    // Get the created comment with user data
    const createdComment = await db.collection<Comment>('comments').findOne({ _id: result.insertedId });
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
    );

    return NextResponse.json({
      message: 'Comment created successfully',
      comment: {
        ...createdComment,
        user,
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
