import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

// GET /api/teacher/exams - Get all exams created by teachers
export async function GET(request: NextRequest) {
  try {
    // Extract teacher from authenticated session
    const teacher = await requireTeacher(request);
    const teacherId = teacher.id;

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");

    const where: any = { teacherId };

    if (moduleId) where.moduleId = moduleId;

    const exams = await prisma.exam.findMany({
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
            cheatingIncidents: true,
          },
        },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    });

    // Calculate statistics for each exam
    const examsWithStats = exams.map((exam: any) => {
      const attempts = exam.attempts;
      const uniqueStudents = new Set(attempts.map((a: any) => a.userId)).size;
      const completedAttempts = attempts.filter(
        (a: any) => a.status === "COMPLETED"
      );
      const flaggedAttempts = attempts.filter(
        (a: any) => a.status === "FLAGGED" || a.riskScore > 50
      );
      const averageScore =
        completedAttempts.length > 0
          ? completedAttempts.reduce(
              (sum: number, a: any) => sum + (a.score || 0),
              0
            ) / completedAttempts.length
          : 0;

      return {
        ...exam,
        stats: {
          totalAttempts: attempts.length,
          uniqueStudents,
          completedAttempts: completedAttempts.length,
          flaggedAttempts: flaggedAttempts.length,
          averageScore: Math.round(averageScore),
          passRate:
            completedAttempts.length > 0
              ? (completedAttempts.filter(
                  (a: any) => (a.score || 0) >= exam.passingMarks
                ).length /
                  completedAttempts.length) *
                100
              : 0,
          cheatingIncidents: attempts.reduce(
            (sum: number, a: any) => sum + a.cheatingIncidents.length,
            0
          ),
        },
      };
    });

    return NextResponse.json({ exams: examsWithStats });
  } catch (error) {
    console.error("Error fetching exams:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/exams - Create a new exam
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
      totalMarks,
      duration,
      maxAttempts = 1,
      shuffleQuestions = true,
      shuffleOptions = true,
      proctoringEnabled = true,
      allowTabSwitch = false,
      maxTabSwitches = 0,
      webcamRequired = false,
      fullScreenRequired = true,
      showResults = false,
      passingMarks,
      startDate,
      endDate,
    } = body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !questions ||
      questions.length === 0 ||
      !totalMarks ||
      !duration ||
      !passingMarks ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate question format
    for (const question of questions) {
      if (
        !question.question ||
        !question.options ||
        question.options.length < 2 ||
        question.correctAnswer === undefined ||
        !question.marks
      ) {
        return NextResponse.json(
          {
            error:
              "Each question must have question text, at least 2 options, correct answer, and marks",
          },
          { status: 400 }
        );
      }
    }

    // Validate total marks
    const calculatedMarks = questions.reduce(
      (sum: number, q: any) => sum + (q.marks || 0),
      0
    );
    if (calculatedMarks !== totalMarks) {
      return NextResponse.json(
        {
          error: `Total marks mismatch. Questions add up to ${calculatedMarks} but totalMarks is ${totalMarks}`,
        },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        moduleId: moduleId || null,
        teacherId,
        questions,
        totalMarks,
        duration,
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        proctoringEnabled,
        allowTabSwitch,
        maxTabSwitches,
        webcamRequired,
        fullScreenRequired,
        showResults,
        passingMarks,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/exams - Update an exam
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Exam ID is required" },
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

    // Check if exam has already started (prevent major modifications)
    const existingExam = await prisma.exam.findUnique({
      where: { id },
      include: { attempts: true },
    });

    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (existingExam.attempts.length > 0) {
      // Only allow limited updates if exam has attempts
      const allowedUpdates = ["title", "description", "endDate", "isActive"];
      const invalidUpdates = Object.keys(updateData).filter(
        (key) => !allowedUpdates.includes(key)
      );

      if (invalidUpdates.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot modify ${invalidUpdates.join(
              ", "
            )} after students have started the exam`,
          },
          { status: 400 }
        );
      }
    }

    const exam = await prisma.exam.update({
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

    return NextResponse.json({ exam });
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/exams - Delete an exam
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Exam ID is required" },
        { status: 400 }
      );
    }

    // Check if exam has attempts
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { attempts: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.attempts.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete exam that has student attempts. Consider deactivating it instead.",
        },
        { status: 400 }
      );
    }

    // Delete the exam
    await prisma.exam.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
