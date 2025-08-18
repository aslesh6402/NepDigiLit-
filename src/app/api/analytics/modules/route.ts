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

    // Get all modules with their progress data
    const modules = await prisma.module.findMany({
      include: {
        progress: {
          where: {
            ...(timeframe !== "all" && {
              lastAccessed: {
                gte: dateFilter,
              },
            }),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                grade: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Calculate analytics for each module
    const moduleAnalytics = modules.map((module) => {
      const totalEnrollments = module.progress.length;
      const completedCount = module.progress.filter((p) => p.completed).length;
      const inProgressCount = module.progress.filter(
        (p) => !p.completed && p.timeSpent > 0
      ).length;
      const notStartedCount =
        totalEnrollments - completedCount - inProgressCount;

      const completionRate =
        totalEnrollments > 0
          ? Math.round((completedCount / totalEnrollments) * 100)
          : 0;

      const totalTimeSpent = module.progress.reduce(
        (sum, p) => sum + p.timeSpent,
        0
      );
      const averageTimeSpent =
        totalEnrollments > 0
          ? Math.round(totalTimeSpent / totalEnrollments)
          : 0;

      const averageScore =
        module.progress.length > 0
          ? Math.round(
              module.progress.reduce((sum, p) => sum + (p.score || 0), 0) /
                module.progress.length
            )
          : 0;

      // Get recent activity
      const recentActivity = module.progress
        .filter((p) => p.lastAccessed >= dateFilter)
        .sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime()
        )
        .slice(0, 5);

      // Calculate engagement metrics
      const activeUsers = module.progress.filter(
        (p) =>
          new Date(p.lastAccessed) >
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      return {
        id: module.id,
        title: module.title,
        category: module.category,
        difficulty: module.difficulty,
        duration: module.duration,
        totalEnrollments,
        completedCount,
        inProgressCount,
        notStartedCount,
        completionRate,
        totalTimeSpent,
        averageTimeSpent,
        averageScore,
        activeUsers,
        recentActivity: recentActivity.map((activity) => ({
          userId: activity.user.id,
          userName: activity.user.name,
          userGrade: activity.user.grade,
          timeSpent: activity.timeSpent,
          score: activity.score,
          completed: activity.completed,
          lastAccessed: activity.lastAccessed,
        })),
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalModules: modules.length,
      totalEnrollments: moduleAnalytics.reduce(
        (sum, m) => sum + m.totalEnrollments,
        0
      ),
      totalCompletions: moduleAnalytics.reduce(
        (sum, m) => sum + m.completedCount,
        0
      ),
      averageCompletionRate:
        moduleAnalytics.length > 0
          ? Math.round(
              moduleAnalytics.reduce((sum, m) => sum + m.completionRate, 0) /
                moduleAnalytics.length
            )
          : 0,
      totalTimeSpent: moduleAnalytics.reduce(
        (sum, m) => sum + m.totalTimeSpent,
        0
      ),
      averageModuleScore:
        moduleAnalytics.length > 0
          ? Math.round(
              moduleAnalytics.reduce((sum, m) => sum + m.averageScore, 0) /
                moduleAnalytics.length
            )
          : 0,
    };

    return NextResponse.json({
      modules: moduleAnalytics,
      overallStats,
    });
  } catch (error) {
    console.error("Error fetching module analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch module analytics" },
      { status: 500 }
    );
  }
}
