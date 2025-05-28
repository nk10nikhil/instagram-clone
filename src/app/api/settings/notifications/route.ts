import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get user's notification settings
    const user = await db.collection('users').findOne(
      { email: session.user?.email },
      { projection: { notificationSettings: 1 } }
    );

    // Default notification settings if none exist
    const defaultSettings = {
      pushNotifications: true,
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      directMessages: true,
      stories: true,
      emailNotifications: true,
      emailLikes: false,
      emailComments: true,
      emailFollows: true,
      emailMentions: true,
      emailDirectMessages: true,
      emailWeeklyDigest: true,
      inAppNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      activityStatus: true,
      onlineStatus: true,
      readReceipts: true,
    };

    const settings = user?.notificationSettings || defaultSettings;

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();
    const { db } = await connectToDatabase();

    // Update user's notification settings
    await db.collection('users').updateOne(
      { email: session.user?.email },
      { 
        $set: { 
          notificationSettings: settings,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
