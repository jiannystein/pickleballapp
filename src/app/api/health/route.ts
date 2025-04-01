import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if database is accessible
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const reviewCount = await prisma.review.count();
    
    // List available models in Prisma client
    const models = Object.keys(prisma).filter(key => 
      !key.startsWith('_') && 
      !['$connect', '$disconnect', '$on', '$transaction', '$use', '$extends'].includes(key)
    );
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount,
        sessionCount,
        reviewCount
      },
      prismaModels: models
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 