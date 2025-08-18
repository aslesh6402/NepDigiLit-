import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/student/quizzes/[attemptId] - Submit quiz answers
export async function PUT(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const body = await request.json();
    const { answers, tabSwitches = 0, timeSpent } = body;
    const attemptId = params.attemptId;

    if (!attemptId) {
      return NextResponse.json(
        { error: "Attempt ID is required" },
        { status: 400 }
      );
    }

    // Get the quiz attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Quiz attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Quiz attempt is not in progress" },
        { status: 400 }
      );
    }

    // Calculate score
    const quiz = attempt.quiz;
    const questions = quiz.questions as any[];
    let score = 0;
    let totalQuestions = questions.length;

    // Check answers
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const studentAnswer = answers[i.toString()];

      if (studentAnswer === question.correctAnswer) {
        score++;
      }
    }

    const percentageScore = Math.round((score / totalQuestions) * 100);

    // Detect suspicious activity
    let suspiciousFlags = [];
    let riskScore = 0;

    if (tabSwitches > 0) {
      suspiciousFlags.push(`${tabSwitches} tab switches detected`);
      riskScore += Math.min(tabSwitches * 10, 30);
    }

    // Check time spent (too fast could be suspicious)
    const expectedMinTime = quiz.timeLimit
      ? quiz.timeLimit * 60 * 0.1
      : totalQuestions * 30; // Minimum 10% of time limit or 30 seconds per question
    if (timeSpent < expectedMinTime) {
      suspiciousFlags.push("Completed too quickly");
      riskScore += 20;
    }

    // Update attempt
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: percentageScore,
        timeSpent,
        endTime: new Date(),
        status: "COMPLETED",
        tabSwitches,
        suspiciousFlags,
      },
    });

    // Create cheating incident if risk score is high
    if (riskScore > 30) {
      await prisma.cheatingIncident.create({
        data: {
          userId: attempt.userId,
          quizAttemptId: attemptId,
          incidentType: "SUSPICIOUS_BEHAVIOR",
          description: `Quiz completed with risk score ${riskScore}: ${suspiciousFlags.join(
            ", "
          )}`,
          evidence: {
            tabSwitches,
            timeSpent,
            suspiciousFlags,
            riskScore,
          },
          severity: riskScore > 60 ? "HIGH" : "MEDIUM",
        },
      });
    }

    // Return results if quiz allows it
    const response: any = {
      attempt: {
        id: updatedAttempt.id,
        score: percentageScore,
        totalQuestions,
        correctAnswers: score,
        status: updatedAttempt.status,
        timeSpent,
      },
    };

    if (quiz.showResults) {
      response.results = {
        passed: percentageScore >= quiz.passingScore,
        passingScore: quiz.passingScore,
        answers: questions.map((q, index) => ({
          question: q.question,
          yourAnswer: answers[index.toString()],
          correctAnswer: q.correctAnswer,
          isCorrect: answers[index.toString()] === q.correctAnswer,
        })),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}

// GET /api/student/quizzes/[attemptId] - Get quiz attempt details
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const attemptId = params.attemptId;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            timeLimit: true,
            showResults: true,
            passingScore: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Quiz attempt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error("Error fetching quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz attempt" },
      { status: 500 }
    );
  }
}
