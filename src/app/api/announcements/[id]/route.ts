import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await verifyAuth();
    if (!token || !token.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update announcement to inactive
    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error deactivating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate announcement' },
      { status: 500 }
    );
  }
} 