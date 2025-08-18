"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  FileText,
  List,
} from "lucide-react";
import { toast } from "sonner";
import AntiCheatMonitor from "@/components/AntiCheatMonitor";
import { useLanguageStore } from "@/lib/stores/languageStore";
import { useUserStore } from "@/lib/stores/userStore";
import BilingualText from "@/components/BilingualText";

interface Question {
  id: number;
  question: { en: string; ne: string };
  options: { en: string; ne: string }[];
  marks: number;
}

interface Exam {
  id: string;
  title: { en: string; ne: string };
  description: { en: string; ne: string };
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  proctoringEnabled: boolean;
  fullScreenRequired: boolean;
  allowTabSwitch: boolean;
  maxTabSwitches: number;
  module: {
    id: string;
    title: { en: string; ne: string };
  };
}

interface ExamAttempt {
  id: string;
  startTime: string;
  answers: Record<string, number>;
}

interface AvailableExam {
  id: string;
  title: { en: string; ne: string } | string;
  description: { en: string; ne: string } | string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  maxAttempts: number;
  endDate: string;
  userStats?: {
    attemptCount: number;
    completedAttempts: number;
    canAttempt: boolean;
    bestScore: number | null;
    hasPassed?: boolean;
  };
  module?: {
    id: string;
    title: { en: string; ne: string } | string;
  };
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const { language, t } = useLanguageStore();
  const { user } = useUserStore();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [violations, setViolations] = useState<any[]>([]);
  const [showExamsList, setShowExamsList] = useState(false);
  const [availableExams, setAvailableExams] = useState<AvailableExam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/student/exams/${examId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load exam");
      }

      setExam(data.exam);

      if (data.attempt) {
        // Resume existing attempt
        setAttempt(data.attempt);
        setAnswers(data.attempt.answers || {});
        const startTime = new Date(data.attempt.startTime).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, data.exam.duration * 60 - elapsed);
        setTimeRemaining(remaining);
      } else {
        // Start new attempt
        await startExamAttempt(data.exam);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exam");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExams = async () => {
    if (!user || user.role !== "STUDENT") return;

    try {
      setLoadingExams(true);
      const response = await fetch(`/api/student/exams?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableExams(data.exams || []);
      }
    } catch (error) {
      console.error("Failed to fetch available exams:", error);
      toast.error(
        t("fetch_exams_error", {
          en: "Failed to load available exams",
          ne: "उपलब्ध परीक्षाहरू लोड गर्न असफल",
        })
      );
    } finally {
      setLoadingExams(false);
    }
  };

  const getDisplayText = (text: string | { en: string; ne: string }) => {
    if (typeof text === "string") {
      return text;
    }
    return text[language] || text.en;
  };

  const startExamAttempt = async (examData: Exam) => {
    try {
      const response = await fetch(`/api/student/exams/${examId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          screenResolution: {
            width: screen.width,
            height: screen.height,
          },
          ipAddress: "client-side", // Will be detected server-side
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start exam");
      }

      setAttempt(data.attempt);
      setTimeRemaining(examData.duration * 60);

      toast.success(
        t("exam_started", {
          en: "Exam started successfully",
          ne: "परीक्षा सफलतापूर्वक सुरु भयो",
        })
      );
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to start exam"
      );
    }
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex.toString()]: answerIndex,
    }));
  };

  const handleAutoSubmit = async () => {
    toast.warning(
      t("auto_submit", {
        en: "Time's up! Submitting exam automatically...",
        ne: "समय सकियो! परीक्षा स्वचालित रूपमा पेश गर्दै...",
      })
    );
    await submitExam();
  };

  const submitExam = async () => {
    if (!attempt || !exam) return;

    setIsSubmitting(true);
    try {
      const timeSpent = exam.duration * 60 - timeRemaining;

      const response = await fetch(
        `/api/student/exams/attempts/${attempt.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            timeSpent,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit exam");
      }

      toast.success(
        t("exam_submitted", {
          en: "Exam submitted successfully!",
          ne: "परीक्षा सफलतापूर्वक पेश गरियो!",
        })
      );

      // Navigate to results or back to module
      router.push(`/modules/${exam.module.id}?examCompleted=true`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit exam");
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const handleViolation = (violation: any) => {
    setViolations((prev) => [...prev, violation]);
  };

  const handleTermination = () => {
    toast.error(
      t("exam_terminated", {
        en: "Exam terminated due to suspicious activity",
        ne: "संदिग्ध गतिविधिका कारण परीक्षा समाप्त गरियो",
      })
    );
    router.push(`/modules/${exam?.module.id}`);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return "text-red-600"; // Last 5 minutes
    if (timeRemaining <= 600) return "text-orange-600"; // Last 10 minutes
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!exam || !attempt) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Anti-cheat monitoring */}
      <AntiCheatMonitor
        examAttemptId={attempt.id}
        proctoringSettings={{
          proctoringEnabled: exam.proctoringEnabled,
          allowTabSwitch: exam.allowTabSwitch,
          maxTabSwitches: exam.maxTabSwitches,
          webcamRequired: false,
          fullScreenRequired: exam.fullScreenRequired,
        }}
        onViolation={handleViolation}
        onTermination={handleTermination}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                <BilingualText text={exam.title} />
              </h1>
              <p className="text-sm text-gray-600">
                {exam.module ? (
                  <BilingualText text={exam.module.title} />
                ) : (
                  <span>
                    {t("general_exam", {
                      en: "General Exam",
                      ne: "सामान्य परीक्षा",
                    })}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {user && user.role === "STUDENT" && (
                <button
                  onClick={() => {
                    setShowExamsList(true);
                    fetchAvailableExams();
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
                >
                  <List className="h-4 w-4" />
                  <span>
                    {t("available_exams", {
                      en: "Available Exams",
                      ne: "उपलब्ध परीक्षाहरू",
                    })}
                  </span>
                </button>
              )}
              <div className={`flex items-center space-x-2 ${getTimeColor()}`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {t("submit_exam", {
                  en: "Submit Exam",
                  ne: "परीक्षा पेश गर्नुहोस्",
                })}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t("exam_instructions", {
                en: "Instructions",
                ne: "निर्देशनहरू",
              })}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                •{" "}
                {t("total_questions", {
                  en: `Total Questions: ${exam.questions.length}`,
                  ne: `कुल प्रश्नहरू: ${exam.questions.length}`,
                })}
              </p>
              <p>
                •{" "}
                {t("total_marks", {
                  en: `Total Marks: ${exam.totalMarks}`,
                  ne: `कुल अंक: ${exam.totalMarks}`,
                })}
              </p>
              <p>
                •{" "}
                {t("passing_marks", {
                  en: `Passing Marks: ${exam.passingMarks}`,
                  ne: `उत्तीर्ण अंक: ${exam.passingMarks}`,
                })}
              </p>
              <p>
                •{" "}
                {t("time_limit", {
                  en: `Time Limit: ${exam.duration} minutes`,
                  ne: `समय सीमा: ${exam.duration} मिनेट`,
                })}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {exam.questions.map((question, index) => (
              <div
                key={question.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                <div className="flex items-start space-x-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                    Q{index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      <BilingualText text={question.question} />
                      <span className="text-sm text-gray-500 ml-2">
                        ({question.marks}{" "}
                        {t("marks", { en: "marks", ne: "अंक" })})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={optionIndex}
                            checked={answers[index.toString()] === optionIndex}
                            onChange={() =>
                              handleAnswerChange(index, optionIndex)
                            }
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">
                            <BilingualText text={option} />
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting
                ? t("submitting", { en: "Submitting...", ne: "पेश गर्दै..." })
                : t("submit_exam", {
                    en: "Submit Exam",
                    ne: "परीक्षा पेश गर्नुहोस्",
                  })}
            </button>
          </div>
        </div>
      </div>

      {/* Available Exams Modal */}
      {showExamsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {t("available_exams", {
                  en: "Available Exams",
                  ne: "उपलब्ध परीक्षाहरू",
                })}
              </h3>
              <button
                onClick={() => setShowExamsList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingExams ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {t("loading_exams", {
                      en: "Loading exams...",
                      ne: "परीक्षाहरू लोड गर्दै...",
                    })}
                  </p>
                </div>
              ) : availableExams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>
                    {t("no_exams", {
                      en: "No exams available at the moment",
                      ne: "अहिले कुनै परीक्षाहरू उपलब्ध छैनन्",
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableExams.map((availableExam) => (
                    <div
                      key={availableExam.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        availableExam.id === examId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {getDisplayText(availableExam.title)}
                            </h4>
                            {availableExam.id === examId && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {t("current", { en: "Current", ne: "हालको" })}
                              </span>
                            )}
                          </div>
                          {availableExam.module && (
                            <p className="text-sm text-gray-600 mb-2">
                              {t("module", { en: "Module", ne: "मोड्युल" })}:{" "}
                              {getDisplayText(availableExam.module.title)}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span>
                              <Clock className="h-4 w-4 inline mr-1" />
                              {availableExam.duration}{" "}
                              {t("min", { en: "min", ne: "मिनेट" })}
                            </span>
                            <span>
                              {availableExam.totalMarks}{" "}
                              {t("marks", { en: "marks", ne: "अंकहरू" })}
                            </span>
                            <span>
                              {t("due", { en: "Due", ne: "अन्तिम मिति" })}:{" "}
                              {new Date(
                                availableExam.endDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {availableExam.userStats && (
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  availableExam.userStats.canAttempt
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {availableExam.userStats.attemptCount}/
                                {availableExam.maxAttempts}{" "}
                                {t("attempts_used", {
                                  en: "attempts used",
                                  ne: "प्रयासहरू प्रयोग गरियो",
                                })}
                              </span>
                              {availableExam.userStats.bestScore !== null && (
                                <span className="text-xs text-gray-600">
                                  {t("best", { en: "Best", ne: "उत्तम" })}:{" "}
                                  {availableExam.userStats.bestScore}%
                                </span>
                              )}
                              {availableExam.userStats.hasPassed && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  <CheckCircle className="h-3 w-3 inline mr-1" />
                                  {t("passed", {
                                    en: "Passed",
                                    ne: "उत्तीर्ण",
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {availableExam.id === examId ? (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                              {t("current_exam", {
                                en: "Current Exam",
                                ne: "हालको परीक्षा",
                              })}
                            </span>
                          ) : availableExam.userStats?.canAttempt ? (
                            <button
                              onClick={() => {
                                setShowExamsList(false);
                                window.open(
                                  `/exams/${availableExam.id}`,
                                  "_blank"
                                );
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              {t("take_exam", {
                                en: "Take Exam",
                                ne: "परीक्षा दिनुहोस्",
                              })}
                            </button>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                              {t("unavailable", {
                                en: "Unavailable",
                                ne: "अनुपलब्ध",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowExamsList(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                {t("close", { en: "Close", ne: "बन्द गर्नुहोस्" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("confirm_submit", {
                en: "Confirm Submission",
                ne: "पेश गर्न पुष्टि गर्नुहोस्",
              })}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("submit_warning", {
                en: "Are you sure you want to submit your exam? You cannot change your answers after submission.",
                ne: "के तपाईं आफ्नो परीक्षा पेश गर्न चाहनुहुन्छ? पेश गरेपछि तपाईंले आफ्ना उत्तरहरू परिवर्तन गर्न सक्नुहुन्न।",
              })}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              >
                {t("cancel", { en: "Cancel", ne: "रद्द गर्नुहोस्" })}
              </button>
              <button
                onClick={submitExam}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {t("confirm", { en: "Confirm", ne: "पुष्टि गर्नुहोस्" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
