import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireTeacher } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProgress = searchParams.get("includeProgress") === "true";
    const teacherView = searchParams.get("teacherView") === "true";

    const modules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: includeProgress
        ? {
            progress: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    grade: true,
                  },
                },
              },
            },
          }
        : undefined,
    });

    if (teacherView) {
      // Calculate analytics for each module
      const modulesWithAnalytics = await Promise.all(
        modules.map(async (module) => {
          const totalStudents = await prisma.user.count({
            where: { role: "STUDENT" },
          });

          const completedCount = await prisma.moduleProgress.count({
            where: {
              moduleId: module.id,
              completed: true,
            },
          });

          const inProgressCount = await prisma.moduleProgress.count({
            where: {
              moduleId: module.id,
              completed: false,
            },
          });

          const averageScore = await prisma.moduleProgress.aggregate({
            where: {
              moduleId: module.id,
              score: { not: null },
            },
            _avg: {
              score: true,
            },
          });

          return {
            ...module,
            analytics: {
              totalStudents,
              completedCount,
              inProgressCount,
              averageScore: Math.round(averageScore._avg.score || 0),
              completionRate:
                totalStudents > 0
                  ? Math.round((completedCount / totalStudents) * 100)
                  : 0,
            },
          };
        })
      );

      return NextResponse.json(modulesWithAnalytics);
    }

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require teacher authentication for creating modules
    const teacher = await requireTeacher(request);

    const body = await request.json();
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      lessons,
      isOffline,
    } = body;

    // Validate required fields
    if (!title || !description || !category || !difficulty || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const module = await prisma.module.create({
      data: {
        title,
        description,
        category,
        difficulty,
        duration: parseInt(duration),
        lessons: lessons || [],
        isOffline: isOffline ?? true,
      },
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require teacher authentication for updating modules
    const teacher = await requireTeacher(request);

    const body = await request.json();
    const {
      id,
      title,
      description,
      category,
      difficulty,
      duration,
      lessons,
      isActive,
      isOffline,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Module ID is required" },
        { status: 400 }
      );
    }

    const module = await prisma.module.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(duration && { duration: parseInt(duration) }),
        ...(lessons && { lessons }),
        ...(isActive !== undefined && { isActive }),
        ...(isOffline !== undefined && { isOffline }),
      },
    });

    return NextResponse.json(module);
  } catch (error) {
    console.error("Error updating module:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require teacher authentication for deleting modules
    const teacher = await requireTeacher(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Module ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const module = await prisma.module.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}
