import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Story } from '@/models/Post';
import sharp from 'sharp';

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

    // Include current user in the list
    const userIds = [userId, ...following];

    // Get active stories (not expired)
    const now = new Date();
    const stories = await db
      .collection('stories')
      .find({
        userId: { $in: userIds },
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Group stories by user
    const storiesByUser = stories.reduce((acc, story) => {
      const userIdStr = story.userId.toString();
      if (!acc[userIdStr]) {
        acc[userIdStr] = [];
      }
      acc[userIdStr].push(story);
      return acc;
    }, {} as Record<string, any[]>);

    // Get user details and check if stories are viewed
    const users = await Promise.all(
      Object.keys(storiesByUser).map(async (userIdStr) => {
        const user = await db.collection('users').findOne(
          { _id: new ObjectId(userIdStr) },
          { projection: { username: 1, profilePicture: 1 } }
        );

        const userStories = storiesByUser[userIdStr];
        const hasUnviewedStory = userStories.some(story =>
          !story.viewers.some((viewer: ObjectId) => viewer.equals(userId))
        );

        return {
          _id: userIdStr,
          username: user?.username || 'Unknown',
          profilePicture: user?.profilePicture,
          hasStory: true,
          isViewed: !hasUnviewedStory,
        };
      })
    );

    return NextResponse.json({
      users: users.filter(user => user.username !== 'Unknown'),
      stories: storiesByUser,
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const media = formData.get('media') as File;
    const caption = formData.get('caption') as string;
    const textOverlays = formData.get('textOverlays') as string;

    if (!media) {
      return NextResponse.json(
        { message: 'Media file is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    // Process media file
    const mediaBuffer = Buffer.from(await media.arrayBuffer());
    let mediaUrl = '';
    let mediaType: 'image' | 'video' = 'image';

    if (media.type.startsWith('image/')) {
      // Process image
      const processedBuffer = await sharp(mediaBuffer)
        .resize(1080, 1920, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      mediaUrl = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
      mediaType = 'image';
    } else if (media.type.startsWith('video/')) {
      // For video, store as base64 (in production, upload to cloud storage)
      mediaUrl = `data:${media.type};base64,${mediaBuffer.toString('base64')}`;
      mediaType = 'video';
    }

    // Parse text overlays
    let overlays = [];
    if (textOverlays) {
      try {
        overlays = JSON.parse(textOverlays);
      } catch (error) {
        console.error('Invalid text overlays data:', error);
      }
    }

    // Create story (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newStory: Omit<Story, '_id'> = {
      userId,
      media: mediaUrl,
      mediaType,
      caption: caption || '',
      viewers: [],
      viewsCount: 0,
      expiresAt,
      createdAt: new Date(),
    };

    const result = await db.collection<Story>('stories').insertOne(newStory);

    // Get the created story with user data
    const createdStory = await db.collection<Story>('stories').findOne({ _id: result.insertedId });
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
    );

    return NextResponse.json({
      message: 'Story created successfully',
      story: {
        ...createdStory,
        user,
        textOverlays: overlays,
      },
    });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
