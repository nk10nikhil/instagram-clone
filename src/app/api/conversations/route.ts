import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Conversation } from '@/models/Message';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);

    // Get conversations where user is a participant
    const conversations = await db
      .collection<Conversation>('conversations')
      .find({
        participants: userId,
      })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Get participant details and last message for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Get participant details
        const participantDetails = await Promise.all(
          conversation.participants.map(async (participantId) => {
            const user = await db.collection('users').findOne(
              { _id: participantId },
              { 
                projection: { 
                  username: 1, 
                  fullName: 1, 
                  profilePicture: 1, 
                  isOnline: 1 
                } 
              }
            );
            return { _id: participantId, ...user };
          })
        );

        // Get last message
        let lastMessage = null;
        if (conversation.lastMessage) {
          lastMessage = await db.collection('messages').findOne({
            _id: conversation.lastMessage,
          });
        }

        return {
          ...conversation,
          participants: participantDetails,
          lastMessage,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Error fetching conversations:', error);
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

    const { participantIds, isGroup, groupName } = await request.json();

    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { message: 'Participant IDs are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(session.user.id);
    const participants = [userId, ...participantIds.map((id: string) => new ObjectId(id))];

    // Check if conversation already exists (for non-group chats)
    if (!isGroup && participants.length === 2) {
      const existingConversation = await db.collection<Conversation>('conversations').findOne({
        participants: { $all: participants, $size: 2 },
        isGroup: false,
      });

      if (existingConversation) {
        return NextResponse.json({ conversation: existingConversation });
      }
    }

    // Create new conversation
    const newConversation: Omit<Conversation, '_id'> = {
      participants,
      isGroup: isGroup || false,
      groupName: isGroup ? groupName : undefined,
      groupAdmins: isGroup ? [userId] : undefined,
      unreadCount: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Conversation>('conversations').insertOne(newConversation);

    // Get the created conversation with participant details
    const createdConversation = await db.collection<Conversation>('conversations').findOne({
      _id: result.insertedId,
    });

    const participantDetails = await Promise.all(
      participants.map(async (participantId) => {
        const user = await db.collection('users').findOne(
          { _id: participantId },
          { 
            projection: { 
              username: 1, 
              fullName: 1, 
              profilePicture: 1, 
              isOnline: 1 
            } 
          }
        );
        return { _id: participantId, ...user };
      })
    );

    return NextResponse.json({
      conversation: {
        ...createdConversation,
        participants: participantDetails,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
