import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/student/exams/[id]/submit - Submit exam attempt
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
    const {
      attemptId,
      answers,
      timeSpent,
      tabSwitches = 0,
      suspiciousFlags = [],
      riskScore = 0,
    } = body;

    // Get the exam to calculate score
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Calculate score
    const questions = exam.questions as any[];
    let totalMarks = 0;
    let obtainedMarks = 0;

    questions.forEach((question, index) => {
      totalMarks += question.marks || 1;
      const studentAnswer = answers[index];
      if (
        studentAnswer !== undefined &&
        studentAnswer === question.correctAnswer
      ) {
        obtainedMarks += question.marks || 1;
      }
    });

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    // Update exam attempt
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: obtainedMarks,
        percentage,
        timeSpent,
        endTime: new Date(),
        status: "COMPLETED",
        tabSwitches,
        suspiciousFlags,
        riskScore,
      },
    });

    // Create cheating incidents if risk score is high
    if (riskScore > 50 || suspiciousFlags.length > 0) {
      await prisma.cheatingIncident.create({
        data: {
          userId: user.id,
          examAttemptId: attemptId,
          incidentType: "DEVICE_MALFUNCTION", // This would be determined by the flags
          description: `High risk exam attempt with score ${riskScore}. Flags: ${suspiciousFlags.join(
            ", "
          )}`,
          evidence: { suspiciousFlags, riskScore, tabSwitches },
          severity: riskScore > 80 ? "HIGH" : riskScore > 50 ? "MEDIUM" : "LOW",
        },
      });
    }

    return NextResponse.json({
      attempt: updatedAttempt,
      result: {
        score: obtainedMarks,
        totalMarks,
        percentage: Math.round(percentage),
        passed: percentage >= (exam.passingMarks / exam.totalMarks) * 100,
      },
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      { error: "Failed to submit exam" },
      { status: 500 }
    );
  }
}
