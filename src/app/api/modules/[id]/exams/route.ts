import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id;
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get active exams for this module
    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        moduleId,
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        totalMarks: true,
        passingMarks: true,
        maxAttempts: true,
        startDate: true,
        endDate: true,
        proctoringEnabled: true,
        fullScreenRequired: true,
      },
      orderBy: {
        startDate: "asc",
      },
    });

    // If user is a student, check their attempts for each exam
    if (user.role === "STUDENT") {
      const examsWithAttempts = await Promise.all(
        exams.map(async (exam) => {
          const attempts = await prisma.examAttempt.count({
            where: {
              examId: exam.id,
              userId: user.id,
            },
          });

          const canTakeExam = attempts < exam.maxAttempts;

          return {
            ...exam,
            attempts,
            canTakeExam,
          };
        })
      );

      return NextResponse.json({ exams: examsWithAttempts });
    }

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("Error fetching module exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}
