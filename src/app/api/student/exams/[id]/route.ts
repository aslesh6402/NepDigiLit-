import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = params.id;
    const user = await getUserFromRequest(request);

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student access required" },
        { status: 401 }
      );
    }

    // Get exam details
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        module: {
          select: { id: true, title: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Check if exam is currently active
    const now = new Date();
    if (now < exam.startDate || now > exam.endDate || !exam.isActive) {
      return NextResponse.json(
        { error: "Exam is not currently available" },
        { status: 403 }
      );
    }

    // Check student's attempts
    const attempts = await prisma.examAttempt.count({
      where: {
        examId,
        userId: user.id,
      },
    });

    if (attempts >= exam.maxAttempts) {
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 403 }
      );
    }

    // Check if student has an ongoing attempt
    const ongoingAttempt = await prisma.examAttempt.findFirst({
      where: {
        examId,
        userId: user.id,
        status: "IN_PROGRESS",
      },
    });

    if (ongoingAttempt) {
      // Return existing attempt
      return NextResponse.json({
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          questions: exam.questions,
          shuffleQuestions: exam.shuffleQuestions,
          shuffleOptions: exam.shuffleOptions,
          proctoringEnabled: exam.proctoringEnabled,
          fullScreenRequired: exam.fullScreenRequired,
          allowTabSwitch: exam.allowTabSwitch,
          maxTabSwitches: exam.maxTabSwitches,
          module: exam.module,
        },
        attempt: {
          id: ongoingAttempt.id,
          startTime: ongoingAttempt.startTime,
          answers: ongoingAttempt.answers,
        },
        isNewAttempt: false,
      });
    }

    // Shuffle questions if required
    let questions = exam.questions as any[];
    if (exam.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Shuffle options if required
    if (exam.shuffleOptions) {
      questions = questions.map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questions,
        proctoringEnabled: exam.proctoringEnabled,
        fullScreenRequired: exam.fullScreenRequired,
        allowTabSwitch: exam.allowTabSwitch,
        maxTabSwitches: exam.maxTabSwitches,
        module: exam.module,
      },
      attempt: null,
      isNewAttempt: true,
    });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam" },
      { status: 500 }
    );
  }
}

// POST /api/student/exams/[id] - Start a new exam attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = params.id;
    const user = await getUserFromRequest(request);

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Student access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userAgent, screenResolution, ipAddress } = body;

    // Create new exam attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        userId: user.id,
        answers: {},
        timeSpent: 0,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || {},
        screenResolution: screenResolution || {},
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    console.error("Error starting exam attempt:", error);
    return NextResponse.json(
      { error: "Failed to start exam attempt" },
      { status: 500 }
    );
  }
}
