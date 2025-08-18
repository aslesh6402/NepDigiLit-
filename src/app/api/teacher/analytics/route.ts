import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

// GET /api/teacher/analytics - Get comprehensive teacher dashboard analytics
export async function GET(request: NextRequest) {
  try {
    // Extract teacher from authenticated session
    const teacher = await requireTeacher(request);
    const teacherId = teacher.id;

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");
    const timeRange = searchParams.get("timeRange") || "30"; // days

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange));

    // Build base filters
    const todoFilter: any = { teacherId };
    const quizFilter: any = { teacherId };
    const examFilter: any = { teacherId };

    if (moduleId) {
      todoFilter.moduleId = moduleId;
      quizFilter.moduleId = moduleId;
      examFilter.moduleId = moduleId;
    }

    // Get basic counts for todos
    const todoCount = await prisma.todo.count({
      where: todoFilter,
    });

    const todoProgressCount = await prisma.todoProgress.count({
      where: {
        todo: { teacherId },
        completed: true,
      },
    });

    const totalTodoProgress = await prisma.todoProgress.count({
      where: {
        todo: { teacherId },
      },
    });

    // Get quiz data
    const quizCount = await prisma.quiz.count({
      where: quizFilter,
    });

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: { teacherId },
        createdAt: { gte: dateFrom },
      },
      include: {
        quiz: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Get exam data
    const examCount = await prisma.exam.count({
      where: examFilter,
    });

    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        exam: { teacherId },
        createdAt: { gte: dateFrom },
      },
      include: {
        exam: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        cheatingIncidents: true,
      },
    });

    // Get cheating incidents
    const cheatingIncidents = await prisma.cheatingIncident.findMany({
      where: {
        timestamp: { gte: dateFrom },
        examAttempt: {
          exam: { teacherId },
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        examAttempt: {
          include: {
            exam: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Calculate statistics
    const completedQuizAttempts = quizAttempts.filter(
      (a) => a.status === "COMPLETED"
    );
    const completedExamAttempts = examAttempts.filter(
      (a) => a.status === "COMPLETED"
    );

    const todoStats = {
      total: todoCount,
      totalAssignments: totalTodoProgress,
      completed: todoProgressCount,
      pending: totalTodoProgress - todoProgressCount,
      overdue: 0, // We'll simplify this for now
    };

    const quizStats = {
      total: quizCount,
      totalAttempts: quizAttempts.length,
      completedAttempts: completedQuizAttempts.length,
      averageScore:
        completedQuizAttempts.length > 0
          ? Math.round(
              completedQuizAttempts
                .filter((a) => a.score !== null)
                .reduce((sum, a) => sum + (a.score || 0), 0) /
                completedQuizAttempts.filter((a) => a.score !== null).length
            )
          : 0,
      passRate: (() => {
        const scoredAttempts = completedQuizAttempts.filter(
          (a) => a.score !== null
        );
        if (scoredAttempts.length === 0) return 0;

        const passedAttempts = scoredAttempts.filter((attempt) => {
          return (
            attempt.quiz && (attempt.score || 0) >= attempt.quiz.passingScore
          );
        });

        return Math.round(
          (passedAttempts.length / scoredAttempts.length) * 100
        );
      })(),
    };

    const examStats = {
      total: examCount,
      totalAttempts: examAttempts.length,
      completedAttempts: completedExamAttempts.length,
      flaggedAttempts: examAttempts.filter((a) => a.status === "FAILED").length,
      averageScore:
        completedExamAttempts.length > 0
          ? Math.round(
              completedExamAttempts
                .filter((a) => a.score !== null)
                .reduce((sum, a) => sum + (a.score || 0), 0) /
                completedExamAttempts.filter((a) => a.score !== null).length
            )
          : 0,
      passRate: (() => {
        const scoredAttempts = completedExamAttempts.filter(
          (a) => a.score !== null
        );
        if (scoredAttempts.length === 0) return 0;

        const passedAttempts = scoredAttempts.filter((attempt) => {
          return (
            attempt.exam && (attempt.score || 0) >= attempt.exam.passingMarks
          );
        });

        return Math.round(
          (passedAttempts.length / scoredAttempts.length) * 100
        );
      })(),
      cheatingIncidents: cheatingIncidents.length,
      highRiskAttempts: examAttempts.filter((a) => a.riskScore > 70).length,
    };

    // Get recent activity - simplified
    const recentTodos = await prisma.todo.findMany({
      where: todoFilter,
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const recentQuizzes = await prisma.quiz.findMany({
      where: quizFilter,
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const recentExams = await prisma.exam.findMany({
      where: examFilter,
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const recentActivity = [
      ...recentTodos.map((todo) => ({
        type: "todo" as const,
        id: todo.id,
        title: todo.title,
        createdAt: todo.createdAt,
        stats: "Todo created",
      })),
      ...recentQuizzes.map((quiz) => ({
        type: "quiz" as const,
        id: quiz.id,
        title: quiz.title,
        createdAt: quiz.createdAt,
        stats: "Quiz created",
      })),
      ...recentExams.map((exam) => ({
        type: "exam" as const,
        id: exam.id,
        title: exam.title,
        createdAt: exam.createdAt,
        stats: "Exam created",
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    // Get student performance overview - simplified
    const studentMap = new Map<string, any>();

    // Collect student data from quiz attempts
    completedQuizAttempts.forEach((attempt) => {
      if (attempt.score !== null) {
        if (!studentMap.has(attempt.userId)) {
          studentMap.set(attempt.userId, {
            id: attempt.userId,
            name: attempt.user.name,
            email: attempt.user.email,
            todosCompleted: 0,
            todosTotal: 0,
            quizAttempts: 0,
            quizAvgScore: 0,
            examAttempts: 0,
            examAvgScore: 0,
            cheatingIncidents: 0,
          });
        }
        const student = studentMap.get(attempt.userId);
        student.quizAttempts++;
        student.quizAvgScore =
          (student.quizAvgScore * (student.quizAttempts - 1) + attempt.score) /
          student.quizAttempts;
      }
    });

    // Collect student data from exam attempts
    completedExamAttempts.forEach((attempt) => {
      if (attempt.score !== null) {
        if (!studentMap.has(attempt.userId)) {
          studentMap.set(attempt.userId, {
            id: attempt.userId,
            name: attempt.user.name,
            email: attempt.user.email,
            todosCompleted: 0,
            todosTotal: 0,
            quizAttempts: 0,
            quizAvgScore: 0,
            examAttempts: 0,
            examAvgScore: 0,
            cheatingIncidents: 0,
          });
        }
        const student = studentMap.get(attempt.userId);
        student.examAttempts++;
        student.examAvgScore =
          (student.examAvgScore * (student.examAttempts - 1) + attempt.score) /
          student.examAttempts;
        student.cheatingIncidents += attempt.cheatingIncidents?.length || 0;
      }
    });

    const studentPerformance = Array.from(studentMap.values())
      .map((student) => ({
        ...student,
        quizAvgScore: Math.round(student.quizAvgScore),
        examAvgScore: Math.round(student.examAvgScore),
        todoCompletionRate: 0, // Simplified for now
      }))
      .sort((a, b) => b.examAvgScore - a.examAvgScore);

    return NextResponse.json({
      analytics: {
        todos: todoStats,
        quizzes: quizStats,
        exams: examStats,
        cheating: {
          totalIncidents: cheatingIncidents.length,
          recentIncidents: cheatingIncidents.slice(0, 10),
          incidentsByType: cheatingIncidents.reduce((acc: any, incident) => {
            acc[incident.incidentType] = (acc[incident.incidentType] || 0) + 1;
            return acc;
          }, {}),
          incidentsBySeverity: cheatingIncidents.reduce(
            (acc: any, incident) => {
              acc[incident.severity] = (acc[incident.severity] || 0) + 1;
              return acc;
            },
            {}
          ),
        },
      },
      recentActivity,
      studentPerformance: studentPerformance.slice(0, 20),
      timeRange: parseInt(timeRange),
    });
  } catch (error) {
    console.error("Error fetching teacher analytics:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
