import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const progress = await prisma.moduleProgress.findMany({
      where: { userId },
      include: {
        module: {
          select: {
            title: true,
            category: true,
            difficulty: true,
          },
        },
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, moduleId, completed, score, timeSpent, currentLesson } =
      body;

    const progress = await prisma.moduleProgress.upsert({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
      update: {
        completed,
        score,
        timeSpent,
        currentLesson,
        lastAccessed: new Date(),
      },
      create: {
        userId,
        moduleId,
        completed: completed || false,
        score,
        timeSpent: timeSpent || 0,
        currentLesson: currentLesson || 0,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
