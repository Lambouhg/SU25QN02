import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

type PrismaError = Error & { code?: string };

type PositionWhereInput = {
  level?: string;
  OR?: Array<{
    positionName?: { contains: string; mode: 'insensitive' };
    displayName?: { contains: string; mode: 'insensitive' };
  }>;
};

type PositionUpdateInput = {
  positionName?: string;
  level?: string;
  key?: string;
  displayName?: string;
  order?: number;
};

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level'); // filter theo level nếu có

    const where = level ? { level } : {};

    const positions = await prisma.position.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ 
      error: 'Lấy danh sách position thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, positionName, level, displayName, order = 0 } = body;

    // Kiểm tra required fields
    if (!key || !positionName || !level || !displayName) {
      return NextResponse.json({ 
        error: 'Missing required fields: key, positionName, level, displayName' 
      }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: {
        key,
        positionName,
        level,
        displayName,
        order,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json({ 
      error: 'Tạo position thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Update a position
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, positionName, level, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    const existingPosition = await prisma.position.findUnique({
      where: { id }
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    const updates: PositionUpdateInput = {};

    if (positionName && level) {
      updates.positionName = positionName;
      updates.level = level;
      updates.key = `${positionName.toLowerCase().replace(/\s+/g, '_')}_${level.toLowerCase()}`;
      updates.displayName = `${positionName} - ${level}`;
    } else if (positionName) {
      updates.positionName = positionName;
      updates.key = `${positionName.toLowerCase().replace(/\s+/g, '_')}_${existingPosition.level.toLowerCase()}`;
      updates.displayName = `${positionName} - ${existingPosition.level}`;
    } else if (level) {
      updates.level = level;
      updates.key = `${existingPosition.positionName.toLowerCase().replace(/\s+/g, '_')}_${level.toLowerCase()}`;
      updates.displayName = `${existingPosition.positionName} - ${level}`;
    }

    if (typeof order === 'number') {
      updates.order = order;
    }

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error('Error updating position:', error);

    if (error instanceof Error && (error as PrismaError).code === 'P2002') {
      return NextResponse.json(
        { error: 'This position and level combination already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a position
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    const deletedPosition = await prisma.position.delete({
      where: { id }
    });

    if (!deletedPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Position deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting position:', error);

    if (error instanceof Error && (error as PrismaError).code === 'P2025') {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
