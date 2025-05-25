import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Notification } from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    // Get notifications for the user
    const notifications = await db
      .collection<Notification>('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Get user details for each notification
    const notificationsWithUserData = await Promise.all(
      notifications.map(async (notification) => {
        const fromUser = await db.collection('users').findOne(
          { _id: notification.fromUserId },
          { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
        );

        return {
          ...notification,
          fromUser,
        };
      })
    );

    // Count unread notifications
    const unreadCount = await db
      .collection<Notification>('notifications')
      .countDocuments({ userId, isRead: false });

    return NextResponse.json({
      notifications: notificationsWithUserData,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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

    const { 
      userId, 
      type, 
      entityId, 
      entityType, 
      content 
    } = await request.json();

    if (!userId || !type) {
      return NextResponse.json(
        { message: 'User ID and type are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const fromUserId = new ObjectId(session.user.id);
    const targetUserId = new ObjectId(userId);

    // Don't create notification for self
    if (fromUserId.equals(targetUserId)) {
      return NextResponse.json({ message: 'Cannot notify self' }, { status: 400 });
    }

    // Check if similar notification already exists (to avoid spam)
    const existingNotification = await db
      .collection<Notification>('notifications')
      .findOne({
        userId: targetUserId,
        fromUserId,
        type,
        entityId: entityId ? new ObjectId(entityId) : undefined,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Within last 24 hours
      });

    if (existingNotification) {
      return NextResponse.json({ message: 'Notification already exists' });
    }

    // Create notification
    const newNotification: Omit<Notification, '_id'> = {
      userId: targetUserId,
      fromUserId,
      type,
      entityId: entityId ? new ObjectId(entityId) : undefined,
      entityType,
      content,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Notification>('notifications').insertOne(newNotification);

    // Get the created notification with user data
    const createdNotification = await db.collection<Notification>('notifications').findOne({
      _id: result.insertedId,
    });

    const fromUser = await db.collection('users').findOne(
      { _id: fromUserId },
      { projection: { username: 1, profilePicture: 1, isVerified: 1 } }
    );

    return NextResponse.json({
      message: 'Notification created successfully',
      notification: {
        ...createdNotification,
        fromUser,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
