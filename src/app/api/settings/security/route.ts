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
    
    // Get user's security settings
    const user = await db.collection('users').findOne(
      { email: session.user?.email },
      { projection: { securitySettings: 1 } }
    );

    // Default security settings if none exist
    const defaultSettings = {
      twoFactorEnabled: false,
      loginNotifications: true,
      suspiciousActivity: true,
      dataDownload: true,
      accountDeactivation: false,
    };

    const settings = user?.securitySettings || defaultSettings;

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching security settings:', error);
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

    // Update user's security settings
    await db.collection('users').updateOne(
      { email: session.user?.email },
      { 
        $set: { 
          securitySettings: settings,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
