import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { message: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { message: 'New password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Find the user
        const user = await db.collection('users').findOne({
            email: session.user?.email
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { message: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update the user's password
        await db.collection('users').updateOne(
            { email: session.user?.email },
            {
                $set: {
                    password: hashedNewPassword,
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
