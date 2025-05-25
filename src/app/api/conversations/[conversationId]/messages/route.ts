import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Message } from '@/models/Message';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const conversationObjectId = new ObjectId(conversationId);
    const userId = new ObjectId(session.user.id);

    const db = await getDatabase();

    // Verify user is participant in conversation
    const conversation = await db.collection('conversations').findOne({
      _id: conversationObjectId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get messages for the conversation
    const messages = await db
      .collection<Message>('messages')
      .find({
        conversationId: conversationObjectId,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: 1 })
      .toArray();

    // Get sender details for each message
    const messagesWithSenderData = await Promise.all(
      messages.map(async (message) => {
        const sender = await db.collection('users').findOne(
          { _id: message.senderId },
          { projection: { username: 1, profilePicture: 1 } }
        );

        return {
          ...message,
          sender,
        };
      })
    );

    // Mark messages as read by current user
    await db.collection('messages').updateMany(
      {
        conversationId: conversationObjectId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
      },
      {
        $addToSet: {
          readBy: {
            userId,
            readAt: new Date(),
          },
        },
      }
    );

    return NextResponse.json({ messages: messagesWithSenderData });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
