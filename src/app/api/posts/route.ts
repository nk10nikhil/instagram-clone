import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Post } from '@/models/Post';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const caption = formData.get('caption') as string;
    const location = formData.get('location') as string;
    const images = formData.getAll('images') as File[];

    if (images.length === 0) {
      return NextResponse.json(
        { message: 'At least one image is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    // Process and save images
    const processedImages: string[] = [];
    
    for (const image of images) {
      const buffer = Buffer.from(await image.arrayBuffer());
      
      // Process image with Sharp
      const processedBuffer = await sharp(buffer)
        .resize(1080, 1080, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // In a real app, you would upload to a cloud storage service
      // For now, we'll create a base64 data URL
      const base64Image = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
      processedImages.push(base64Image);
    }

    // Extract hashtags and mentions from caption
    const hashtags = caption?.match(/#[\w]+/g)?.map(tag => tag.slice(1)) || [];
    const mentions = caption?.match(/@[\w]+/g)?.map(mention => mention.slice(1)) || [];

    // Get mentioned user IDs
    const mentionedUserIds: ObjectId[] = [];
    if (mentions.length > 0) {
      const mentionedUsers = await db
        .collection('users')
        .find({ username: { $in: mentions } })
        .toArray();
      mentionedUserIds.push(...mentionedUsers.map(user => user._id));
    }

    // Create post
    const newPost: Omit<Post, '_id'> = {
      userId,
      caption: caption || '',
      images: processedImages,
      location: location || '',
      tags: hashtags,
      mentions: mentionedUserIds,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isArchived: false,
      commentsDisabled: false,
      hideLikeCount: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Post>('posts').insertOne(newPost);

    // Update user's posts count
    await db.collection('users').updateOne(
      { _id: userId },
      { $inc: { postsCount: 1 } }
    );

    // Get the created post with user data
    const createdPost = await db.collection<Post>('posts').findOne({ _id: result.insertedId });
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
    );

    return NextResponse.json({
      message: 'Post created successfully',
      post: {
        ...createdPost,
        user,
      },
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
