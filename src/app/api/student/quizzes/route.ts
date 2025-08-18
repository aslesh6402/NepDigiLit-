import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/student/quizzes - Get available quizzes for student
export async function GET(request: NextRequest) {
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

    const where: any = {
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
      AND: [
        {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      ],
    };

    if (moduleId) where.moduleId = moduleId;

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true },
        },
        module: {
          select: { id: true, title: true },
        },
        attempts: {
          where: { userId },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Add attempt information for each quiz
    const quizzesWithAttempts = quizzes.map((quiz: any) => {
      const userAttempts = quiz.attempts;
      const completedAttempts = userAttempts.filter(
        (a: any) => a.status === "COMPLETED"
      ).length;
      const canAttempt = completedAttempts < quiz.maxAttempts;
      const bestScore =
        userAttempts.length > 0
          ? Math.max(
              ...userAttempts
                .filter((a: any) => a.score !== null)
                .map((a: any) => a.score)
            )
          : null;

      return {
        ...quiz,
        attempts: undefined, // Remove attempts from response for security
        userStats: {
          attemptCount: userAttempts.length,
          completedAttempts,
          canAttempt,
          bestScore,
          hasPassed: bestScore !== null && bestScore >= quiz.passingScore,
        },
      };
    });

    return NextResponse.json({ quizzes: quizzesWithAttempts });
  } catch (error) {
    console.error("Error fetching student quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST /api/student/quizzes - Start a new quiz attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, userId } = body;

    if (!quizId || !userId) {
      return NextResponse.json(
        { error: "Quiz ID and User ID are required" },
        { status: 400 }
      );
    }

    // Get quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        attempts: {
          where: { userId },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (!quiz.isActive) {
      return NextResponse.json(
        { error: "Quiz is not active" },
        { status: 400 }
      );
    }

    // Check if quiz is within time bounds
    const now = new Date();
    if (quiz.startDate && quiz.startDate > now) {
      return NextResponse.json(
        { error: "Quiz has not started yet" },
        { status: 400 }
      );
    }

    if (quiz.endDate && quiz.endDate < now) {
      return NextResponse.json({ error: "Quiz has ended" }, { status: 400 });
    }

    // Check attempt limits
    const completedAttempts = quiz.attempts.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    if (completedAttempts >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 400 }
      );
    }

    // Check for existing in-progress attempt
    const inProgressAttempt = quiz.attempts.find(
      (a) => a.status === "IN_PROGRESS"
    );
    if (inProgressAttempt) {
      return NextResponse.json(
        { error: "You have an in-progress attempt. Please complete it first." },
        { status: 400 }
      );
    }

    // Get client information
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Prepare questions (remove correct answers)
    const questionsForStudent = (quiz.questions as any[]).map((q, index) => ({
      id: index,
      question: q.question,
      options: quiz.shuffleOptions ? shuffleArray([...q.options]) : q.options,
    }));

    // Shuffle questions if required
    const finalQuestions = quiz.shuffleQuestions
      ? shuffleArray([...questionsForStudent])
      : questionsForStudent;

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers: {},
        ipAddress,
        userAgent: { userAgent },
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        startTime: attempt.startTime,
        timeLimit: quiz.timeLimit,
        questions: finalQuestions,
      },
    });
  } catch (error) {
    console.error("Error starting quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to start quiz attempt" },
      { status: 500 }
    );
  }
}

// Utility function to shuffle array
function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
