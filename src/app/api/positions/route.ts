import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {  } from '@/lib/utils';

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



// Get all positions or filter by level
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    const query: PositionWhereInput = {};

    // Filter by level if provided
    if (level) {
      query.level = level;
    }

    // Search in positionName or displayName if search term provided
    if (search) {
      query.OR = [
        { positionName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const positions = await prisma.position.findMany({
      where: {
        ...query,
        ...(search ? {
          OR: [
            { positionName: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      orderBy: {
        order: 'asc'
      }
    });

    return (NextResponse.json(positions, { status: 200 }));
  } catch (error) {
    console.error('Error fetching positions:', error);
    return (NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const positions = Array.isArray(body) ? body : [body];

    const validLevels = ['Junior', 'Middle', 'Senior', 'Lead', 'Principal'];

    const prepared = positions.map((pos) => {
      const { positionName, level, order = 0 } = pos;

      if (!positionName || !level || !validLevels.includes(level)) {
        throw new Error('Invalid or missing positionName or level');
      }

      const key = `${positionName.toLowerCase().replace(/\s+/g, '_')}_${level.toLowerCase()}`;
      const displayName = `${positionName} - ${level}`;

      return {
        key,
        positionName,
        level,
        displayName,
        order,
      };
    });

    const result = await prisma.position.createMany({
      data: prepared,
      skipDuplicates: true,
    });

    return (NextResponse.json(result, { status: 201 }));
  } catch (error) {
    console.error('Bulk insert error:', error);
    
    if (error instanceof Error && (error as PrismaError).code === 'P2002') {
      return (NextResponse.json(
        { error: 'Some positions already exist (duplicate key)' },
        { status: 409 }
      ));
    }

    return (NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

// Update a position
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, positionName, level, order } = body;

    if (!id) {
      return (NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      ));
    }

    const existingPosition = await prisma.position.findUnique({
      where: { id }
    });

    if (!existingPosition) {
      return (NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      ));
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

    return (NextResponse.json(updatedPosition, { status: 200 }));
  } catch (error) {
    console.error('Error updating position:', error);

    if (error instanceof Error && (error as PrismaError).code === 'P2002') {
      return (NextResponse.json(
        { error: 'This position and level combination already exists' },
        { status: 409 }
      ));
    }

    return (NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

// Delete a position
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return (NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      ));
    }

    const deletedPosition = await prisma.position.delete({
      where: { id }
    });

    if (!deletedPosition) {
      return (NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      ));
    }

    return (NextResponse.json(
      { message: 'Position deleted successfully' },
      { status: 200 }
    ));
  } catch (error) {
    console.error('Error deleting position:', error);

    if (error instanceof Error && (error as PrismaError).code === 'P2025') {
      return (NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      ));
    }

    return (NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}
