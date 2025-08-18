import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/student/exams/attempts/[attemptId] - Track cheating activities during exam
export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const body = await request.json();
    const { eventType, timestamp, details } = body;
    const attemptId = params.attemptId;

    if (!attemptId || !eventType) {
      return NextResponse.json(
        { error: "Attempt ID and event type are required" },
        { status: 400 }
      );
    }

    // Get the exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Invalid or completed exam attempt" },
        { status: 400 }
      );
    }

    // Process different types of tracking events
    let updateData: any = {};
    let riskIncrease = 0;
    let shouldFlag = false;

    switch (eventType) {
      case "TAB_SWITCH":
        updateData.tabSwitches = { increment: 1 };
        updateData.tabSwitchTimes = {
          push: new Date().toISOString(),
        };
        riskIncrease = 10;

        if (!attempt.exam.allowTabSwitch) {
          shouldFlag = true;
          riskIncrease = 25;
        } else if (attempt.tabSwitches >= attempt.exam.maxTabSwitches) {
          shouldFlag = true;
          riskIncrease = 30;
        }
        break;

      case "MOUSE_LEFT_WINDOW":
        updateData.mouseLeftCount = { increment: 1 };
        riskIncrease = 5;
        break;

      case "FULLSCREEN_EXIT":
        updateData.fullScreenExits = { increment: 1 };
        riskIncrease = 15;

        if (attempt.exam.fullScreenRequired) {
          shouldFlag = true;
          riskIncrease = 25;
        }
        break;

      case "RIGHT_CLICK":
        updateData.rightClicks = { increment: 1 };
        riskIncrease = 3;
        break;

      case "COPY_PASTE":
        updateData.copyPasteEvents = { increment: 1 };
        riskIncrease = 20;
        shouldFlag = true;
        break;

      case "SUSPICIOUS_KEYBOARD":
        updateData.keyboardEvents = {
          push: { timestamp: new Date().toISOString(), details },
        };
        riskIncrease = 15;
        break;

      case "DEVELOPER_TOOLS":
        riskIncrease = 50;
        shouldFlag = true;
        break;

      default:
        riskIncrease = 5;
    }

    // Update risk score
    updateData.riskScore = { increment: riskIncrease };

    // Add to suspicious flags
    updateData.suspiciousFlags = {
      push: {
        type: eventType,
        timestamp: new Date().toISOString(),
        details: details || {},
      },
    };

    // Update the attempt
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: updateData,
    });

    // Create cheating incident if flagged
    if (shouldFlag || updatedAttempt.riskScore + riskIncrease > 60) {
      await prisma.cheatingIncident.create({
        data: {
          userId: attempt.userId,
          examAttemptId: attemptId,
          incidentType: eventType as any,
          description: `${eventType} detected during exam`,
          evidence: {
            eventType,
            timestamp,
            details,
            currentRiskScore: updatedAttempt.riskScore + riskIncrease,
          },
          severity:
            updatedAttempt.riskScore + riskIncrease > 80 ? "CRITICAL" : "HIGH",
        },
      });
    }

    // Auto-terminate if risk score is too high
    if (updatedAttempt.riskScore + riskIncrease > 90) {
      await prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: "FAILED",
          endTime: new Date(),
        },
      });

      return NextResponse.json({
        terminated: true,
        message: "Exam terminated due to suspicious activity",
      });
    }

    return NextResponse.json({
      success: true,
      riskScore: updatedAttempt.riskScore + riskIncrease,
      warning: riskIncrease > 15 ? "Suspicious activity detected" : null,
    });
  } catch (error) {
    console.error("Error tracking exam activity:", error);
    return NextResponse.json(
      { error: "Failed to track activity" },
      { status: 500 }
    );
  }
}

// PUT /api/student/exams/attempts/[attemptId] - Submit exam answers
export async function PUT(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const body = await request.json();
    const { answers, timeSpent } = body;
    const attemptId = params.attemptId;

    if (!attemptId) {
      return NextResponse.json(
        { error: "Attempt ID is required" },
        { status: 400 }
      );
    }

    // Get the exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Exam attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Exam attempt is not in progress" },
        { status: 400 }
      );
    }

    // Calculate score
    const exam = attempt.exam;
    const questions = exam.questions as any[];
    let totalScore = 0;
    let maxScore = 0;

    // Check answers and calculate score
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const studentAnswer = answers[i.toString()];
      maxScore += question.marks;

      if (studentAnswer === question.correctAnswer) {
        totalScore += question.marks;
      }
    }

    const percentageScore = Math.round((totalScore / maxScore) * 100);

    // Final risk assessment
    let finalRiskScore = attempt.riskScore;

    // Check time spent patterns
    const expectedMinTime = exam.duration * 60 * 0.2; // Minimum 20% of exam duration
    if (timeSpent < expectedMinTime) {
      finalRiskScore += 25;
    }

    // Determine final status
    let finalStatus = "COMPLETED";
    if (finalRiskScore > 70) {
      finalStatus = "FLAGGED";
    }

    // Update attempt with final results
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: totalScore,
        percentage: percentageScore,
        timeSpent,
        endTime: new Date(),
        status: finalStatus as any,
        riskScore: finalRiskScore,
        isReviewed: false,
      },
    });

    // Create final cheating incident if flagged
    if (finalStatus === "FLAGGED") {
      await prisma.cheatingIncident.create({
        data: {
          userId: attempt.userId,
          examAttemptId: attemptId,
          incidentType: "DEVICE_MALFUNCTION",
          description: `Exam flagged for review with risk score ${finalRiskScore}`,
          evidence: {
            finalRiskScore,
            timeSpent,
            tabSwitches: attempt.tabSwitches,
            suspiciousActivities: attempt.suspiciousFlags,
          },
          severity: finalRiskScore > 85 ? "CRITICAL" : "HIGH",
        },
      });
    }

    // Return results (limited information for students)
    const response: any = {
      attempt: {
        id: updatedAttempt.id,
        status: updatedAttempt.status,
        timeSpent,
        submittedAt: updatedAttempt.endTime,
      },
    };

    // Only show score if exam allows it
    if (exam.showResults) {
      response.attempt.score = totalScore;
      response.attempt.maxScore = maxScore;
      response.attempt.percentage = percentageScore;
      response.attempt.passed = totalScore >= exam.passingMarks;
    } else {
      response.message =
        "Your exam has been submitted and will be reviewed by your teacher.";
    }

    if (finalStatus === "FLAGGED") {
      response.warning =
        "Your exam has been flagged for review due to suspicious activity.";
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      { error: "Failed to submit exam" },
      { status: 500 }
    );
  }
}
