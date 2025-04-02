import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { uploadFile } from '@/lib/file-utils';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    console.log('User creating location request:', JSON.stringify(user));

    // Parse the form data
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const instructions = formData.get('instructions') as string;
    const bookingUrl = formData.get('bookingUrl') as string;
    const photo = formData.get('photo') as File | null;

    if (!name || !address) {
      return new NextResponse(JSON.stringify({ error: 'Name and address are required' }), {
        status: 400,
      });
    }

    // Handle photo upload if provided
    let photoUrl = null;
    if (photo) {
      try {
        photoUrl = await uploadFile(photo, 'uploads/locations', 'location-request');
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        return new NextResponse(JSON.stringify({ 
          error: 'Failed to upload photo',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        }), {
          status: 500,
        });
      }
    }

    // Create the location request with properly typed data
    const locationRequestData: Prisma.LocationRequestCreateInput = {
      name,
      address,
      instructions,
      status: 'pending',
      requestedBy: {
        connect: { id: user.userId }
      }
    };

    // Add the optional fields if they exist
    if (photoUrl) {
      // @ts-ignore - Add photoUrl even though it might not be in the type yet
      locationRequestData.photoUrl = photoUrl;
    }
    
    if (bookingUrl) {
      // @ts-ignore - Add bookingUrl even though it might not be in the type yet
      locationRequestData.bookingUrl = bookingUrl;
    }

    const locationRequest = await prisma.locationRequest.create({
      data: locationRequestData,
    });

    console.log('Location request created successfully:', JSON.stringify(locationRequest));
    return new NextResponse(JSON.stringify(locationRequest));
  } catch (error) {
    console.error('Error creating location request:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
    });
  }
} 