import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../lib/prisma";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        onboardingStatus: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Sử dụng onboardingStatus field từ database
    const onboardingCompleted = user.onboardingStatus || false;
    const needsOnboarding = !onboardingCompleted;
    
    // Kiểm tra xem user có phải là user mới không (tạo trong vòng 24h)
    const isNewUser = new Date().getTime() - user.createdAt.getTime() < 24 * 60 * 60 * 1000;

    return NextResponse.json({
      needsOnboarding,
      isNewUser,
      onboardingCompleted
    });

  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { onboardingStatus } = body;

    if (typeof onboardingStatus !== 'boolean') {
      return NextResponse.json(
        { error: "onboardingStatus must be a boolean" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: { onboardingStatus },
      select: {
        id: true,
        onboardingStatus: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      onboardingStatus: updatedUser.onboardingStatus,
      message: "Onboarding status updated successfully"
    });

  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
