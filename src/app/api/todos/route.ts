import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const moduleId = searchParams.get("moduleId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    let whereClause: any = { userId };
    if (moduleId) {
      whereClause.moduleId = moduleId;
    }

    const todoProgress = await prisma.todoProgress.findMany({
      where: whereClause,
      include: {
        module: {
          select: {
            id: true,
            title: true,
            todos: true,
          },
        },
      },
    });

    return NextResponse.json(todoProgress);
  } catch (error) {
    console.error("Error fetching todo progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch todo progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, moduleId, todoId, completed } = body;

    if (!userId || !moduleId || todoId === undefined) {
      return NextResponse.json(
        { error: "User ID, Module ID, and Todo ID are required" },
        { status: 400 }
      );
    }

    // Upsert todo progress
    const todoProgress = await prisma.todoProgress.upsert({
      where: {
        userId_moduleId_todoId: {
          userId,
          moduleId,
          todoId: parseInt(todoId),
        },
      },
      update: {
        completed: completed || false,
      },
      create: {
        userId,
        moduleId,
        todoId: parseInt(todoId),
        completed: completed || false,
      },
    });

    return NextResponse.json(todoProgress);
  } catch (error) {
    console.error("Error updating todo progress:", error);
    return NextResponse.json(
      { error: "Failed to update todo progress" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, moduleId, todoId, completed } = body;

    if (!userId || !moduleId || todoId === undefined) {
      return NextResponse.json(
        { error: "User ID, Module ID, and Todo ID are required" },
        { status: 400 }
      );
    }

    const todoProgress = await prisma.todoProgress.update({
      where: {
        userId_moduleId_todoId: {
          userId,
          moduleId,
          todoId: parseInt(todoId),
        },
      },
      data: {
        completed: completed || false,
      },
    });

    return NextResponse.json(todoProgress);
  } catch (error) {
    console.error("Error updating todo progress:", error);
    return NextResponse.json(
      { error: "Failed to update todo progress" },
      { status: 500 }
    );
  }
}
