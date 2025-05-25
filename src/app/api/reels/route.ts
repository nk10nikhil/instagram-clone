import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Reel } from '@/models/Reel';
import sharp from 'sharp';

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

    // Include user's own reels and followed users' reels
    const feedUserIds = [userId, ...following];

    // Get reels from followed users and own reels
    const reels = await db
      .collection<Reel>('reels')
      .find({
        userId: { $in: feedUserIds },
        isPublic: true,
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Get user details for each reel
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

    return NextResponse.json({
      reels: reelsWithUserData,
    });
  } catch (error) {
    console.error('Error fetching reels:', error);
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
    const video = formData.get('video') as File;
    const caption = formData.get('caption') as string;
    const music = formData.get('music') as string;

    if (!video) {
      return NextResponse.json(
        { message: 'Video file is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    // Process video (in a real app, you'd upload to cloud storage)
    const videoBuffer = Buffer.from(await video.arrayBuffer());
    
    // Create thumbnail from video (using sharp for now, in production use ffmpeg)
    let thumbnailUrl = '';
    try {
      // This is a placeholder - in production, extract frame from video
      const thumbnailBuffer = await sharp(videoBuffer)
        .resize(400, 600)
        .jpeg({ quality: 80 })
        .toBuffer();
      
      thumbnailUrl = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
    } catch (error) {
      console.log('Could not generate thumbnail:', error);
    }

    // For demo purposes, convert video to base64 (in production, upload to cloud)
    const videoUrl = `data:${video.type};base64,${videoBuffer.toString('base64')}`;

    // Extract hashtags from caption
    const hashtags = caption?.match(/#[\w]+/g)?.map(tag => tag.slice(1)) || [];

    // Parse music data if provided
    let musicData = null;
    if (music) {
      try {
        musicData = JSON.parse(music);
      } catch (error) {
        console.error('Invalid music data:', error);
      }
    }

    // Create reel
    const newReel: Omit<Reel, '_id'> = {
      userId,
      videoUrl,
      thumbnailUrl,
      caption: caption || '',
      music: musicData,
      effects: [],
      duration: 30, // Default duration, in production extract from video
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      tags: hashtags,
      mentions: [],
      isPublic: true,
      allowComments: true,
      allowDuet: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Reel>('reels').insertOne(newReel);

    // Get the created reel with user data
    const createdReel = await db.collection<Reel>('reels').findOne({ _id: result.insertedId });
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
    );

    return NextResponse.json({
      message: 'Reel created successfully',
      reel: {
        ...createdReel,
        user,
      },
    });
  } catch (error) {
    console.error('Error creating reel:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
