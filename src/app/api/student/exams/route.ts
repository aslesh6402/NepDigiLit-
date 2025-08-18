import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/student/exams - Get available exams for student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const moduleId = searchParams.get("moduleId");

    // First try to get user from request headers for authentication
    const authenticatedUser = await getUserFromRequest(request);
    let studentUserId = userId;

    // If authenticated, use the authenticated user's ID for security
    if (authenticatedUser && authenticatedUser.role === "STUDENT") {
      studentUserId = authenticatedUser.id;
    } else if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!studentUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const where: any = {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    // Only filter by moduleId if it's specifically provided
    if (moduleId) {
      where.moduleId = moduleId;
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true },
        },
        module: {
          select: { id: true, title: true },
        },
        attempts: {
          where: { userId: studentUserId },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ moduleId: "asc" }, { title: "asc" }],
    });

    console.log(`Found ${exams.length} exams for student ${studentUserId}`);

    // Add attempt information for each exam
    const examsWithAttempts = exams.map((exam: any) => {
      const userAttempts = exam.attempts;
      const completedAttempts = userAttempts.filter(
        (a: any) => a.status === "COMPLETED"
      ).length;
      const canAttempt = completedAttempts < exam.maxAttempts;
      const bestScore =
        userAttempts.length > 0
          ? Math.max(
              ...userAttempts
                .filter((a: any) => a.score !== null)
                .map((a: any) => a.score)
            )
          : null;

      const examWithStats = {
        ...exam,
        attempts: undefined, // Remove attempts from response for security
        questions: undefined, // Remove questions for security
        userStats: {
          attemptCount: userAttempts.length,
          completedAttempts,
          canAttempt,
          bestScore,
          hasPassed: bestScore !== null && bestScore >= exam.passingMarks,
          lastAttemptStatus:
            userAttempts.length > 0 ? userAttempts[0].status : null,
        },
      };

      // Log exams without module for debugging
      if (!exam.module && !exam.moduleId) {
        console.log(`Exam ${exam.id} (${exam.title}) has no module assignment`);
      }

      return examWithStats;
    });

    return NextResponse.json({ exams: examsWithAttempts });
  } catch (error) {
    console.error("Error fetching student exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

// POST /api/student/exams - Start a new exam attempt with proctoring
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, userId, deviceInfo } = body;

    if (!examId || !userId) {
      return NextResponse.json(
        { error: "Exam ID and User ID are required" },
        { status: 400 }
      );
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        attempts: {
          where: { userId },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (!exam.isActive) {
      return NextResponse.json(
        { error: "Exam is not active" },
        { status: 400 }
      );
    }

    // Check if exam is within time bounds
    const now = new Date();
    if (exam.startDate > now) {
      return NextResponse.json(
        { error: "Exam has not started yet" },
        { status: 400 }
      );
    }

    if (exam.endDate < now) {
      return NextResponse.json({ error: "Exam has ended" }, { status: 400 });
    }

    // Check attempt limits
    const completedAttempts = exam.attempts.filter(
      (a) => a.status === "COMPLETED" || a.status === "FAILED"
    ).length;
    if (completedAttempts >= exam.maxAttempts) {
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 400 }
      );
    }

    // Check for existing in-progress attempt
    const inProgressAttempt = exam.attempts.find(
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

    // Validate device info for proctoring
    if (
      exam.proctoringEnabled &&
      (!deviceInfo || !deviceInfo.screenResolution)
    ) {
      return NextResponse.json(
        { error: "Device information required for proctored exam" },
        { status: 400 }
      );
    }

    // Prepare questions (remove correct answers)
    const questionsForStudent = (exam.questions as any[]).map((q, index) => ({
      id: index,
      question: q.question,
      options: exam.shuffleOptions ? shuffleArray([...q.options]) : q.options,
      marks: q.marks,
    }));

    // Shuffle questions if required
    const finalQuestions = exam.shuffleQuestions
      ? shuffleArray([...questionsForStudent])
      : questionsForStudent;

    // Create exam attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        userId,
        answers: {},
        timeSpent: 0,
        ipAddress,
        userAgent: { userAgent, ...deviceInfo },
        screenResolution: deviceInfo?.screenResolution || {},
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        examId: attempt.examId,
        startTime: attempt.startTime,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questions: finalQuestions,
        proctoringSettings: {
          proctoringEnabled: exam.proctoringEnabled,
          allowTabSwitch: exam.allowTabSwitch,
          maxTabSwitches: exam.maxTabSwitches,
          webcamRequired: exam.webcamRequired,
          fullScreenRequired: exam.fullScreenRequired,
        },
      },
    });
  } catch (error) {
    console.error("Error starting exam attempt:", error);
    return NextResponse.json(
      { error: "Failed to start exam attempt" },
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
