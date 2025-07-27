import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await getAuth(req);

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            userId,
            message: 'User authenticated successfully'
        });
    } catch (error) {
        console.error('Error in get-token:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 