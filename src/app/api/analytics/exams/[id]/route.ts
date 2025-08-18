import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/analytics/exams/[id] - Get exam analytics (for both teachers and admins)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    const examId = params.id;

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get exam with attempts and related data
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
        // If user is a teacher, only show their exams
        ...(user.role === "TEACHER" ? { teacherId: user.id } : {}),
      },
      include: {
        attempts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            cheatingIncidents: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        module: {
          select: {
            id: true,
            title: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Calculate analytics
    const attempts = exam.attempts;
    const completedAttempts = attempts.filter(
      (a) => a.status === "COMPLETED"
    );
    const failedAttempts = attempts.filter((a) => a.status === "FAILED");
    const passedAttempts = completedAttempts.filter(
      (a) => (a.score || 0) >= exam.passingMarks
    );
    const totalIncidents = attempts.reduce(
      (sum, a) => sum + a.cheatingIncidents.length,
      0
    );

    const avgScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
          completedAttempts.length
        : 0;

    const avgTimeSpent =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + a.timeSpent, 0) /
          completedAttempts.length
        : 0;

    const analytics = {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      failedAttempts: failedAttempts.length,
      passedAttempts: passedAttempts.length,
      passRate:
        completedAttempts.length > 0
          ? (passedAttempts.length / completedAttempts.length) * 100
          : 0,
      totalIncidents,
      avgScore: Math.round(avgScore),
      avgTimeSpent: Math.round(avgTimeSpent / 60), // Convert to minutes
      scoreDistribution: {
        "90-100": completedAttempts.filter((a) => (a.percentage || 0) >= 90).length,
        "80-89": completedAttempts.filter(
          (a) => (a.percentage || 0) >= 80 && (a.percentage || 0) < 90
        ).length,
        "70-79": completedAttempts.filter(
          (a) => (a.percentage || 0) >= 70 && (a.percentage || 0) < 80
        ).length,
        "60-69": completedAttempts.filter(
          (a) => (a.percentage || 0) >= 60 && (a.percentage || 0) < 70
        ).length,
        "Below 60": completedAttempts.filter((a) => (a.percentage || 0) < 60).length,
      },
      riskScoreDistribution: {
        Low: attempts.filter((a) => a.riskScore < 30).length,
        Medium: attempts.filter((a) => a.riskScore >= 30 && a.riskScore < 70)
          .length,
        High: attempts.filter((a) => a.riskScore >= 70).length,
      },
    };

    // Format the response
    const formattedExam = {
      ...exam,
      attempts: exam.attempts.map((attempt: any) => ({
        id: attempt.id,
        userId: attempt.userId,
        student: attempt.user,
        score: attempt.score || 0,
        percentage: attempt.percentage || 0,
        timeSpent: attempt.timeSpent || 0,
        status: attempt.status,
        riskScore: attempt.riskScore || 0,
        tabSwitches: attempt.tabSwitches || 0,
        submittedAt: attempt.endTime || attempt.createdAt,
        cheatingIncidents: attempt.cheatingIncidents || [],
      })),
      analytics,
    };

    return NextResponse.json({ exam: formattedExam });
  } catch (error) {
    console.error("Error fetching exam analytics:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch exam analytics" },
      { status: 500 }
    );
  }
}
