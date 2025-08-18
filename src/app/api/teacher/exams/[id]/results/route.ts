import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

// GET /api/teacher/exams/[id]/results - Get exam results and cheating incidents
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = await requireTeacher(request);
    const examId = params.id;

    // Get exam with attempts and related data
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
        teacherId: teacher.id, // Ensure teacher can only see their own exams
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
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

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
    };

    return NextResponse.json({ exam: formattedExam });
  } catch (error) {
    console.error("Error fetching exam results:", error);

    if (
      error instanceof Error &&
      (error.message === "Authentication required" ||
        error.message === "Teacher access required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch exam results" },
      { status: 500 }
    );
  }
}
