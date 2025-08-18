import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

// GET /api/teacher/quizzes - Get all quizzes created by teachers
export async function GET(request: NextRequest) {
  try {
    // Extract teacher from authenticated session
    const teacher = await requireTeacher(request);
    const teacherId = teacher.id;

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");

    const where: any = { teacherId };

    if (moduleId) where.moduleId = moduleId;

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        module: {
          select: { id: true, title: true },
        },
        attempts: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    // Calculate statistics for each quiz
    const quizzesWithStats = quizzes.map((quiz: any) => {
      const attempts = quiz.attempts;
      const uniqueStudents = new Set(attempts.map((a: any) => a.userId)).size;
      const completedAttempts = attempts.filter(
        (a: any) => a.status === "COMPLETED"
      );
      const averageScore =
        completedAttempts.length > 0
          ? completedAttempts.reduce(
              (sum: number, a: any) => sum + (a.score || 0),
              0
            ) / completedAttempts.length
          : 0;

      return {
        ...quiz,
        stats: {
          totalAttempts: attempts.length,
          uniqueStudents,
          completedAttempts: completedAttempts.length,
          averageScore: Math.round(averageScore),
          passRate:
            completedAttempts.length > 0
              ? (completedAttempts.filter(
                  (a: any) => (a.score || 0) >= quiz.passingScore
                ).length /
                  completedAttempts.length) *
                100
              : 0,
        },
      };
    });

    return NextResponse.json({ quizzes: quizzesWithStats });
  } catch (error) {
    console.error("Error fetching quizzes:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    // Extract teacher from authenticated session
    const teacher = await requireTeacher(request);
    const teacherId = teacher.id;

    const body = await request.json();
    const {
      title,
      description,
      moduleId,
      questions,
      timeLimit,
      maxAttempts = 1,
      shuffleQuestions = false,
      shuffleOptions = false,
      showResults = true,
      passingScore = 60,
      startDate,
      endDate,
    } = body;

    // Validate required fields
    if (!title || !description || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Title, description, and questions are required" },
        { status: 400 }
      );
    }

    // Validate question format
    for (const question of questions) {
      if (
        !question.question ||
        !question.options ||
        question.options.length < 2 ||
        question.correctAnswer === undefined
      ) {
        return NextResponse.json(
          {
            error:
              "Each question must have a question text, at least 2 options, and a correct answer",
          },
          { status: 400 }
        );
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        moduleId: moduleId || null,
        teacherId,
        questions,
        timeLimit,
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        showResults,
        passingScore,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        module: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/quizzes - Update a quiz
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Convert dates to Date objects if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        module: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/quizzes - Delete a quiz
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Delete associated attempts first
    await prisma.quizAttempt.deleteMany({
      where: { quizId: id },
    });

    // Delete the quiz
    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
