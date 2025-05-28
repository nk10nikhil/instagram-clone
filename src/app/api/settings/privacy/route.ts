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

        // Get user's privacy settings
        const user = await db.collection('users').findOne(
            { email: session.user?.email },
            { projection: { privacySettings: 1 } }
        );

        // Default privacy settings if none exist
        const defaultSettings = {
            isPrivateAccount: false,
            allowTagging: 'everyone',
            allowMentions: 'everyone',
            allowComments: 'everyone',
            allowDirectMessages: 'everyone',
            showOnlineStatus: true,
            showLastSeen: true,
            showReadReceipts: true,
            allowStoryReplies: true,
            allowStorySharing: true,
        };

        const settings = user?.privacySettings || defaultSettings;

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching privacy settings:', error);
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

        // Update user's privacy settings
        await db.collection('users').updateOne(
            { email: session.user?.email },
            {
                $set: {
                    privacySettings: settings,
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
