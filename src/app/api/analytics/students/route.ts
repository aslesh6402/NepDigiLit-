import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "week";

    // Calculate date filter based on timeframe
    const now = new Date();
    let dateFilter: Date;

    switch (timeframe) {
      case "week":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(0); // All time
    }

    // Get all students with their progress
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(timeframe !== "all" && {
          updatedAt: {
            gte: dateFilter,
          },
        }),
      },
      include: {
        progress: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate analytics for each student
    const studentAnalytics = students.map((student) => {
      const completedModules = student.progress.filter(
        (p) => p.completed
      ).length;
      const totalTimeSpent = student.progress.reduce(
        (sum, p) => sum + p.timeSpent,
        0
      );
      const averageScore =
        student.progress.length > 0
          ? Math.round(
              student.progress.reduce((sum, p) => sum + (p.score || 0), 0) /
                student.progress.length
            )
          : 0;

      // Calculate overall progress percentage
      const totalModules = 6; // You can make this dynamic by counting all active modules
      const progressPercentage = Math.round(
        (completedModules / totalModules) * 100
      );

      // Get last activity
      const lastActivity =
        student.progress.length > 0
          ? student.progress.reduce(
              (latest, p) =>
                p.lastAccessed > latest ? p.lastAccessed : latest,
              student.progress[0].lastAccessed
            )
          : student.updatedAt;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        grade: student.grade,
        modulesCompleted: completedModules,
        totalModules,
        timeSpent: totalTimeSpent,
        averageScore,
        progress: progressPercentage,
        lastActive: lastActivity,
        isActive:
          new Date(lastActivity) >
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      };
    });

    // Calculate class statistics
    const classStats = {
      totalStudents: students.length,
      activeStudents: studentAnalytics.filter((s) => s.isActive).length,
      completedModules: studentAnalytics.reduce(
        (sum, s) => sum + s.modulesCompleted,
        0
      ),
      averageProgress:
        studentAnalytics.length > 0
          ? Math.round(
              studentAnalytics.reduce((sum, s) => sum + s.progress, 0) /
                studentAnalytics.length
            )
          : 0,
      totalTimeSpent: studentAnalytics.reduce((sum, s) => sum + s.timeSpent, 0),
      averageScore:
        studentAnalytics.length > 0
          ? Math.round(
              studentAnalytics.reduce((sum, s) => sum + s.averageScore, 0) /
                studentAnalytics.length
            )
          : 0,
    };

    return NextResponse.json({
      students: studentAnalytics,
      classStats,
    });
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch student analytics" },
      { status: 500 }
    );
  }
}
