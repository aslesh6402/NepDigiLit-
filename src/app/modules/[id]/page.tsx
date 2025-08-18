"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle,
  Play,
  Lock,
  Trophy,
  Target,
  Star,
  PartyPopper,
  FileText,
  AlertCircle,
  Calendar,
  ListTodo,
  Brain,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProgressStore } from "@/lib/stores/progressStore";
import { useLanguageStore } from "@/lib/stores/languageStore";
import { useTodoStore } from "@/lib/stores/todoStore";
import { Module, Lesson, Todo, TodoProgress } from "@/types/dashboard";
import BilingualText from "@/components/BilingualText";

interface Quiz {
  id: string;
  question: { en: string; ne: string };
  options: { en: string; ne: string }[];
  correctAnswer: number;
  explanation: { en: string; ne: string };
}

interface Exam {
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
}

interface ModuleQuiz {
  id: string;
  title: { en: string; ne: string };
  description: { en: string; ne: string };
  timeLimit?: number;
  maxAttempts: number;
  passingScore: number;
  userStats?: {
    attemptCount: number;
    bestScore: number | null;
    canAttempt: boolean;
    hasPassed?: boolean;
  };
}

interface ModuleTodo {
  id: string;
  title: { en: string; ne: string };
  description: { en: string; ne: string };
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string;
  isCompleted?: boolean;
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const { t } = useLanguageStore();
  const { getModuleProgress, updateProgress, completeLesson } =
    useProgressStore();
  const { getTodoProgress, updateTodoProgress, getModuleTodoProgress } =
    useTodoStore();

  const [module, setModule] = useState<Module | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [quizzes, setQuizzes] = useState<ModuleQuiz[]>([]);
  const [todos, setTodos] = useState<ModuleTodo[]>([]);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [showExams, setShowExams] = useState(false);
  const [showQuizzes, setShowQuizzes] = useState(false);
  const [showTodos, setShowTodos] = useState(false);

  const progress = getModuleProgress(moduleId);

  useEffect(() => {
    fetchModule();
    fetchExams();
    fetchQuizzes();
  }, [moduleId]);

  useEffect(() => {
    if (module) {
      fetchTodos();
    }
  }, [module]);

  const fetchModule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/modules/${moduleId}`);

      if (!response.ok) {
        throw new Error("Module not found");
      }

      const moduleData = await response.json();
      setModule(moduleData);

      // Set current lesson based on progress
      if (progress) {
        setCurrentLesson(progress.currentLesson);
      }

      // Generate quiz questions for practice tests
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch(`/api/student/exams?moduleId=${moduleId}`);
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(
        `/api/student/quizzes?moduleId=${moduleId}&userId=current-user`
      );
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
    }
  };

  const fetchTodos = async () => {
    try {
      if (!module?.todos || module.todos.length === 0) {
        setTodos([]);
        return;
      }

      // Transform module todos to include completion status
      const todosWithProgress = module.todos.map((todo: any, index: number) => {
        const todoProgress = getTodoProgress(moduleId, index);
        return {
          id: `${moduleId}-${index}`,
          title: todo.title,
          description: todo.description,
          priority: todo.priority || "MEDIUM",
          dueDate: todo.dueDate,
          isCompleted: todoProgress?.completed || false,
        };
      });
      setTodos(todosWithProgress);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    }
  };

  // Move hook to top-level and pass language as argument
  const { language } = useLanguageStore();
  const getDisplayText = (text: string | { en: string; ne: string }) => {
    if (typeof text === "string") {
      return text;
    }
    return text[language] || text.en;
  };

  const handleTodoToggle = async (todoId: number, completed: boolean) => {
    if (!module) return;

    try {
      // Update local state immediately for better UX
      updateTodoProgress(moduleId, todoId, completed);

      // Show toast feedback
      toast.success(
        completed
          ? t("todo_completed", {
              en: "Task completed!",
              ne: "कार्य पूरा भयो!",
            })
          : t("todo_unchecked", {
              en: "Task unchecked",
              ne: "कार्य अनचेक भयो",
            }),
        {
          description: completed
            ? t("great_progress", {
                en: "Great progress!",
                ne: "राम्रो प्रगति!",
              })
            : t("task_unmarked", {
                en: "Task unmarked",
                ne: "कार्य अचिन्हित भयो",
              }),
        }
      );

      // Update on server (mock for now)
      // await fetch(`/api/todos`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     moduleId,
      //     todoId,
      //     completed,
      //     userId: 'current-user' // This should come from auth
      //   }),
      // });
    } catch (error) {
      console.error("Failed to update todo:", error);
      // Revert local state on error
      updateTodoProgress(moduleId, todoId, !completed);
      toast.error(
        t("todo_error", {
          en: "Failed to update task",
          ne: "कार्य अपडेट गर्न असफल",
        }),
        {
          description: t("please_try_again", {
            en: "Please try again",
            ne: "कृपया फेरि प्रयास गर्नुहोस्",
          }),
        }
      );
    }
  };

  const handleLessonComplete = async (lessonIndex: number) => {
    if (!module) return;

    try {
      setLessonCompleted(true);

      // Show lesson completion toast
      toast.success(
        t("lesson_completed", {
          en: "Lesson completed!",
          ne: "पाठ पूरा भयो!",
        }),
        {
          description: t("lesson_completed_desc", {
            en: "Great job! You've completed this lesson.",
            ne: "राम्रो काम! तपाईंले यो पाठ पूरा गर्नुभयो।",
          }),
        }
      );

      // Update progress in store
      completeLesson(moduleId, lessonIndex);

      // Update progress on server
      await fetch(`/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          lessonIndex,
          timeSpent: 5, // Add time tracking later
        }),
      });

      // Wait a moment for the toast to be visible
      setTimeout(() => {
        setLessonCompleted(false);

        // Move to next lesson or show completion
        if (lessonIndex < module.lessons.length - 1) {
          setCurrentLesson(lessonIndex + 1);

          // Show next lesson toast
          toast.info(
            t("next_lesson", {
              en: "Next lesson unlocked!",
              ne: "अर्को पाठ खुल्यो!",
            }),
            {
              description: t("next_lesson_desc", {
                en: "You can now access the next lesson.",
                ne: "तपाईं अब अर्को पाठमा पहुँच गर्न सक्नुहुन्छ।",
              }),
            }
          );
        } else {
          // Module completed, show quiz if it's a practice test
          const currentLessonData = module.lessons[lessonIndex];
          if (
            currentLessonData.title.en.toLowerCase().includes("practice test")
          ) {
            setShowQuiz(true);
            toast.info(
              t("quiz_ready", {
                en: "Quiz time!",
                ne: "क्विज समय!",
              }),
              {
                description: t("quiz_ready_desc", {
                  en: "Complete the quiz to finish this module.",
                  ne: "यो मोड्युल समाप्त गर्न क्विज पूरा गर्नुहोस्।",
                }),
              }
            );
          } else {
            // Show module completion
            setShowCompletion(true);
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast.error(
        t("lesson_error", {
          en: "Failed to save progress",
          ne: "प्रगति बचत गर्न असफल",
        }),
        {
          description: t("lesson_error_desc", {
            en: "Please try again.",
            ne: "कृपया फेरि प्रयास गर्नुहोस्।",
          }),
        }
      );
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);

    if (selectedAnswer === quizQuestions[currentQuiz].correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuiz < quizQuestions.length - 1) {
        setCurrentQuiz(currentQuiz + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Quiz completed, calculate final score
        completeQuiz();
      }
    }, 2000);
  };

  const completeQuiz = async () => {
    const finalScore = Math.round((score / quizQuestions.length) * 100);

    try {
      // Update module completion
      await fetch(`/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          completed: true,
          score: finalScore,
        }),
      });

      // Update local progress
      updateProgress(moduleId, { completed: true, score: finalScore });

      // Show completion celebration
      setShowCompletion(true);

      // Show success toast with score
      toast.success(
        t("module_completed", {
          en: "🎉 Module Completed!",
          ne: "🎉 मोड्युल पूरा भयो!",
        }),
        {
          description: t("module_completed_desc", {
            en: `Congratulations! You scored ${finalScore}%`,
            ne: `बधाई छ! तपाईंले ${finalScore}% स्कोर गर्नुभयो`,
          }),
          duration: 6000,
        }
      );
    } catch (error) {
      console.error("Failed to complete module:", error);
      toast.error(
        t("module_error", {
          en: "Failed to complete module",
          ne: "मोड्युल पूरा गर्न असफल",
        }),
        {
          description: t("module_error_desc", {
            en: "Please try again.",
            ne: "कृपया फेरि प्रयास गर्नुहोस्।",
          }),
        }
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Module completion celebration modal
  if (showCompletion && module) {
    const finalScore = progress?.score || 0;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-in zoom-in duration-300">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("congratulations", {
                en: "🎉 Congratulations!",
                ne: "🎉 बधाई छ!",
              })}
            </h2>
            <p className="text-gray-600">
              {t("module_completed_successfully", {
                en: "You have successfully completed this module!",
                ne: "तपाईंले यो मोड्युल सफलतापूर्वक पूरा गर्नुभयो!",
              })}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <BilingualText text={module.title} />
            </h3>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                {t("score", { en: "Score", ne: "स्कोर" })}: {finalScore}%
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-1" />
                {module.duration} {t("minutes", { en: "min", ne: "मिनेट" })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setShowCompletion(false);
                router.push("/modules");
              }}
              className="w-full btn-primary"
            >
              {t("back_to_modules", {
                en: "Back to Modules",
                ne: "मोड्युलहरूमा फर्किनुहोस्",
              })}
            </button>
            <button
              onClick={() => setShowCompletion(false)}
              className="w-full btn-secondary"
            >
              {t("review_module", {
                en: "Review Module",
                ne: "मोड्युल समीक्षा गर्नुहोस्",
              })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Module Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The requested module could not be found."}
          </p>
          <button
            onClick={() => router.push("/modules")}
            className="btn-primary"
          >
            {t("back_to_modules", {
              en: "Back to Modules",
              ne: "मोड्युलहरूमा फर्किनुहोस्",
            })}
          </button>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    // Guard: If no quiz questions or currentQuiz out of bounds, show message
    if (!quizQuestions.length || !quizQuestions[currentQuiz]) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t("no_quiz_questions", {
                en: "No quiz questions available.",
                ne: "कुनै प्रश्नोत्तर उपलब्ध छैन।",
              })}
            </h2>
          </div>
        </div>
      );
    }
    const currentQuestion = quizQuestions[currentQuiz];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("practice_quiz", {
                  en: "Practice Quiz",
                  ne: "अभ्यास क्विज",
                })}
              </h1>
              <div className="text-sm text-gray-500">
                {currentQuiz + 1} / {quizQuestions.length}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                <BilingualText text={currentQuestion.question} />
              </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuizAnswer(index)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedAnswer === index
                        ? showResult
                          ? isCorrect && index === currentQuestion.correctAnswer
                            ? "border-green-500 bg-green-50 text-green-700"
                            : index === currentQuestion.correctAnswer
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-red-500 bg-red-50 text-red-700"
                          : "border-blue-500 bg-blue-50"
                        : showResult && index === currentQuestion.correctAnswer
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <BilingualText text={option} />
                  </button>
                ))}
              </div>
            </div>

            {showResult && (
              <div className="mb-6 p-4 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isCorrect
                    ? t("correct", { en: "Correct!", ne: "सहि!" })
                    : t("incorrect", { en: "Incorrect", ne: "गलत" })}
                </h3>
                <p className="text-gray-700">
                  <BilingualText text={currentQuestion.explanation} />
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {t("score", { en: "Score", ne: "स्कोर" })}: {score} /{" "}
                {currentQuiz + (showResult ? 1 : 0)}
              </div>

              {!showResult ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={selectedAnswer === null}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("submit", { en: "Submit", ne: "पेश गर्नुहोस्" })}
                </button>
              ) : currentQuiz === quizQuestions.length - 1 ? (
                <button
                  onClick={() => router.push("/modules")}
                  className="btn-primary"
                >
                  {t("complete", { en: "Complete", ne: "पूरा" })}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentLessonData = module.lessons[currentLesson];
  const isLessonCompleted = (progress?.currentLesson ?? 0) > currentLesson;
  const canAccessLesson =
    currentLesson === 0 || (progress?.currentLesson ?? 0) >= currentLesson;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/modules")}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back_to_modules", {
              en: "Back to Modules",
              ne: "मोड्युलहरूमा फर्किनुहोस्",
            })}
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <BilingualText text={module.title} />
              </h1>
              <p className="text-gray-600 mb-4">
                <BilingualText text={module.description} />
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {module.duration} {t("minutes", { en: "min", ne: "मिनेट" })}
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {module.lessons.length}{" "}
                  {t("lessons", { en: "lessons", ne: "पाठहरू" })}
                </div>
                {progress && (
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {Math.round(
                      (progress.currentLesson / module.lessons.length) * 100
                    )}
                    % {t("completed", { en: "completed", ne: "पूरा" })}
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <button
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors ml-4"
              onClick={() => {
                // Download module content as a text file
                const content = [
                  `Title: ${
                    typeof module.title === "string"
                      ? module.title
                      : module.title[language] || module.title.en
                  }`,
                  `Description: ${
                    typeof module.description === "string"
                      ? module.description
                      : module.description[language] || module.description.en
                  }`,
                  "",
                  "Lessons:",
                  ...module.lessons.map(
                    (lesson: any, idx: number) =>
                      `\n${idx + 1}. ${
                        typeof lesson.title === "string"
                          ? lesson.title
                          : lesson.title[language] || lesson.title.en
                      }\n${
                        typeof lesson.content === "string"
                          ? lesson.content
                          : lesson.content[language] || lesson.content.en
                      }`
                  ),
                  "",
                  module.todos && module.todos.length > 0
                    ? "Tasks:\n" +
                      module.todos
                        .map(
                          (todo: any, idx: number) =>
                            `${idx + 1}. ${
                              typeof todo.title === "string"
                                ? todo.title
                                : todo.title[language] || todo.title.en
                            } - ${
                              typeof todo.description === "string"
                                ? todo.description
                                : todo.description[language] ||
                                  todo.description.en
                            }`
                        )
                        .join("\n")
                    : "",
                ].join("\n\n");
                const blob = new Blob([content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `module-${moduleId}.txt`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 100);
              }}
              title={t("download_module", {
                en: "Download Module Content",
                ne: "मोड्युल सामग्री डाउनलोड गर्नुहोस्",
              })}
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              {t("download", { en: "Download", ne: "डाउनलोड" })}
            </button>

            {progress?.completed && (
              <div className="flex items-center space-x-2 text-green-600 ml-4">
                <Trophy className="h-6 w-6" />
                <span className="font-semibold">
                  {t("completed", { en: "Completed", ne: "पूरा भयो" })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Lessons Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("lessons", { en: "Lessons", ne: "पाठहरू" })}
              </h2>
              <div className="space-y-2">
                {module.lessons.map((lesson, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (canAccessLesson) {
                        setCurrentLesson(index);
                        setShowQuiz(false);
                        setShowExams(false);
                        setShowQuizzes(false);
                        setShowTodos(false);
                      }
                    }}
                    disabled={!canAccessLesson}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentLesson === index &&
                      !showQuiz &&
                      !showExams &&
                      !showQuizzes &&
                      !showTodos
                        ? "bg-blue-50 border-2 border-blue-200 text-blue-700"
                        : isLessonCompleted
                        ? "bg-green-50 text-green-700"
                        : canAccessLesson
                        ? "hover:bg-gray-50 text-gray-700"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          <BilingualText text={lesson.title} />
                        </div>
                      </div>
                      <div className="ml-2">
                        {(progress?.currentLesson ?? 0) > index ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : currentLesson === index ? (
                          <Play className="h-4 w-4 text-blue-600" />
                        ) : !canAccessLesson ? (
                          <Lock className="h-4 w-4 text-gray-400" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Exams Section */}
            {exams.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("exams", { en: "Exams", ne: "परीक्षाहरू" })}
                </h2>
                <div className="space-y-2">
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => {
                        setShowExams(true);
                        setShowQuiz(false);
                        setShowQuizzes(false);
                        setShowTodos(false);
                      }}
                      disabled={!exam.userStats?.canAttempt}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        showExams
                          ? "bg-purple-50 border-2 border-purple-200 text-purple-700"
                          : exam.userStats?.canAttempt
                          ? "hover:bg-gray-50 text-gray-700"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {getDisplayText(exam.title)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {exam.duration} min • {exam.totalMarks} marks
                          </div>
                          {exam.userStats && (
                            <div className="text-xs text-gray-500">
                              {exam.userStats.attemptCount}/{exam.maxAttempts}{" "}
                              attempts
                            </div>
                          )}
                        </div>
                        <div className="ml-2">
                          {exam.userStats?.canAttempt ? (
                            <FileText className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quizzes Section */}
            {quizzes.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("quizzes", { en: "Quizzes", ne: "प्रश्नोत्तरहरू" })}
                </h2>
                <div className="space-y-2">
                  {quizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      onClick={() => {
                        setShowQuizzes(true);
                        setShowExams(false);
                        setShowQuiz(false);
                        setShowTodos(false);
                      }}
                      disabled={!quiz.userStats?.canAttempt}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        showQuizzes
                          ? "bg-blue-50 border-2 border-blue-200 text-blue-700"
                          : quiz.userStats?.canAttempt
                          ? "hover:bg-gray-50 text-gray-700"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            <BilingualText text={quiz.title} />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {quiz.timeLimit
                              ? `${quiz.timeLimit} min`
                              : "No time limit"}{" "}
                            • {quiz.passingScore}% pass
                          </div>
                          {quiz.userStats && (
                            <div className="text-xs text-gray-500">
                              {quiz.userStats.attemptCount}/{quiz.maxAttempts}{" "}
                              attempts
                            </div>
                          )}
                        </div>
                        <div className="ml-2">
                          {quiz.userStats?.canAttempt ? (
                            <Brain className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Todos Section */}
            {todos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("todos", { en: "Tasks", ne: "कार्यहरू" })}
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowTodos(true);
                      setShowExams(false);
                      setShowQuiz(false);
                      setShowQuizzes(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      showTodos
                        ? "bg-green-50 border-2 border-green-200 text-green-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {t("view_tasks", {
                            en: "View Tasks",
                            ne: "कार्यहरू हेर्नुहोस्",
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {todos.filter((t) => t.isCompleted).length}/
                          {todos.length} completed
                        </div>
                      </div>
                      <div className="ml-2">
                        <ListTodo className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Practice Quiz Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("practice_quiz", {
                  en: "Practice Quiz",
                  ne: "अभ्यास प्रश्नोत्तर",
                })}
              </h2>
              <button
                onClick={() => {
                  setShowQuiz(true);
                  setShowExams(false);
                  setShowQuizzes(false);
                  setShowTodos(false);
                  setCurrentQuiz(0);
                  setScore(0);
                  setSelectedAnswer(null);
                  setShowResult(false);
                }}
                disabled={!canAccessLesson}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  showQuiz
                    ? "bg-green-50 border-2 border-green-200 text-green-700"
                    : canAccessLesson
                    ? "hover:bg-gray-50 text-gray-700"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {t("take_quiz", {
                        en: "Take Quiz",
                        ne: "प्रश्नोत्तर दिनुहोस्",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {quizQuestions.length} questions
                    </div>
                  </div>
                  <div className="ml-2">
                    {canAccessLesson ? (
                      <Star className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {/* Exams Content */}
              {showExams ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t("available_exams", {
                      en: "Available Exams",
                      ne: "उपलब्ध परीक्षाहरू",
                    })}
                  </h2>
                  {exams.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>
                        {t("no_exams", {
                          en: "No exams available for this module",
                          ne: "यस मोड्युलका लागि कुनै परीक्षाहरू उपलब्ध छैनन्",
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {getDisplayText(exam.title)}
                              </h3>
                              <p className="text-gray-600 mb-4">
                                {getDisplayText(exam.description)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mt-1 mb-4">
                            <span className="text-sm text-gray-600">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {exam.duration}{" "}
                              {t("min", { en: "min", ne: "मिनेट" })}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Trophy className="h-4 w-4 inline mr-1" />
                              {exam.totalMarks}{" "}
                              {t("marks", { en: "marks", ne: "अंकहरू" })}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Target className="h-4 w-4 inline mr-1" />
                              {t("pass", {
                                en: "Pass",
                                ne: "उत्तीर्णांक",
                              })}
                              : {exam.passingMarks}
                            </span>
                            <span className="text-sm text-gray-600">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {t("due", { en: "Due", ne: "अन्तिम मिति" })}:{" "}
                              {new Date(exam.endDate).toLocaleDateString()}
                            </span>
                          </div>

                          {exam.userStats && (
                            <div className="mb-4">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  exam.userStats.canAttempt
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {exam.userStats.attemptCount}/{exam.maxAttempts}{" "}
                                {t("attempts_used", {
                                  en: "attempts used",
                                  ne: "प्रयासहरू प्रयोग गरियो",
                                })}
                              </span>
                              {exam.userStats.bestScore !== null && (
                                <span className="ml-2 text-xs text-gray-600">
                                  {t("best", { en: "Best", ne: "उत्तम" })}:{" "}
                                  {exam.userStats.bestScore}%
                                </span>
                              )}
                              {exam.userStats.hasPassed && (
                                <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  <CheckCircle className="h-3 w-3 inline mr-1" />
                                  {t("passed", {
                                    en: "Passed",
                                    ne: "उत्तीर्ण",
                                  })}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <p>
                                {t("max_attempts", {
                                  en: "Maximum attempts",
                                  ne: "अधिकतम प्रयासहरू",
                                })}
                                : {exam.maxAttempts}
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                window.open(`/exams/${exam.id}`, "_blank");
                              }}
                              disabled={!exam.userStats?.canAttempt}
                              className={
                                exam.userStats?.canAttempt
                                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }
                            >
                              {exam.userStats?.canAttempt ? (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  {t("take_exam", {
                                    en: "Take Exam",
                                    ne: "परीक्षा दिनुहोस्",
                                  })}
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  {t("exam_unavailable", {
                                    en: "Unavailable",
                                    ne: "उपलब्ध छैन",
                                  })}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : showQuizzes ? (
                /* Quizzes Content */
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t("available_quizzes", {
                      en: "Available Quizzes",
                      ne: "उपलब्ध प्रश्नोत्तरहरू",
                    })}
                  </h2>
                  {quizzes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>
                        {t("no_quizzes", {
                          en: "No quizzes available for this module",
                          ne: "यस मोड्युलका लागि कुनै प्रश्नोत्तरहरू उपलब्ध छैनन्",
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                <BilingualText text={quiz.title} />
                              </h3>
                              <p className="text-gray-600 mb-4">
                                <BilingualText text={quiz.description} />
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mt-1 mb-4">
                            {quiz.timeLimit && (
                              <span className="text-sm text-gray-600">
                                <Clock className="h-4 w-4 inline mr-1" />
                                {quiz.timeLimit}{" "}
                                {t("min", { en: "min", ne: "मिनेट" })}
                              </span>
                            )}
                            <span className="text-sm text-gray-600">
                              <Target className="h-4 w-4 inline mr-1" />
                              {t("pass", {
                                en: "Pass",
                                ne: "उत्तीर्णांक",
                              })}
                              : {quiz.passingScore}%
                            </span>
                          </div>

                          {quiz.userStats && (
                            <div className="mb-4">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  quiz.userStats.canAttempt
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {quiz.userStats.attemptCount}/{quiz.maxAttempts}{" "}
                                {t("attempts_used", {
                                  en: "attempts used",
                                  ne: "प्रयासहरू प्रयोग गरियो",
                                })}
                              </span>
                              {quiz.userStats.bestScore !== null && (
                                <span className="ml-2 text-xs text-gray-600">
                                  {t("best", { en: "Best", ne: "उत्तम" })}:{" "}
                                  {quiz.userStats.bestScore}%
                                </span>
                              )}
                              {quiz.userStats.hasPassed && (
                                <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  <CheckCircle className="h-3 w-3 inline mr-1" />
                                  {t("passed", {
                                    en: "Passed",
                                    ne: "उत्तीर्ण",
                                  })}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <p>
                                {t("max_attempts", {
                                  en: "Maximum attempts",
                                  ne: "अधिकतम प्रयासहरू",
                                })}
                                : {quiz.maxAttempts}
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                window.open(`/quizzes/${quiz.id}`, "_blank");
                              }}
                              disabled={!quiz.userStats?.canAttempt}
                              className={
                                quiz.userStats?.canAttempt
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }
                            >
                              {quiz.userStats?.canAttempt ? (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  {t("take_quiz", {
                                    en: "Take Quiz",
                                    ne: "प्रश्नोत्तर दिनुहोस्",
                                  })}
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  {t("quiz_unavailable", {
                                    en: "Unavailable",
                                    ne: "उपलब्ध छैन",
                                  })}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : showTodos ? (
                /* Todos Content */
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t("module_tasks", {
                      en: "Module Tasks",
                      ne: "मोड्युल कार्यहरू",
                    })}
                  </h2>
                  {todos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ListTodo className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>
                        {t("no_todos", {
                          en: "No tasks available for this module",
                          ne: "यस मोड्युलका लागि कुनै कार्यहरू उपलब्ध छैनन्",
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span className="font-medium text-gray-900">
                              {t("progress", { en: "Progress", ne: "प्रगति" })}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {todos.filter((t) => t.isCompleted).length} /{" "}
                            {todos.length}{" "}
                            {t("completed", { en: "completed", ne: "पूरा" })}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                (todos.filter((t) => t.isCompleted).length /
                                  todos.length) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {todos.map((todo) => (
                        <div
                          key={todo.id}
                          className={`border rounded-lg p-6 transition-all ${
                            todo.isCompleted
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <button
                              onClick={() => {
                                const todoIndex = parseInt(
                                  todo.id.split("-")[1]
                                );
                                handleTodoToggle(todoIndex, !todo.isCompleted);
                              }}
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                todo.isCompleted
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300 hover:border-green-400"
                              }`}
                            >
                              {todo.isCompleted && (
                                <CheckSquare className="h-3 w-3" />
                              )}
                            </button>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3
                                  className={`text-lg font-semibold ${
                                    todo.isCompleted
                                      ? "text-green-700 line-through"
                                      : "text-gray-900"
                                  }`}
                                >
                                  <BilingualText text={todo.title} />
                                </h3>

                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      todo.priority === "HIGH"
                                        ? "bg-red-100 text-red-800"
                                        : todo.priority === "MEDIUM"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {todo.priority === "HIGH" ? (
                                      <>
                                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                                        {t("high_priority", {
                                          en: "High",
                                          ne: "उच्च",
                                        })}
                                      </>
                                    ) : todo.priority === "MEDIUM" ? (
                                      t("medium_priority", {
                                        en: "Medium",
                                        ne: "मध्यम",
                                      })
                                    ) : (
                                      t("low_priority", { en: "Low", ne: "कम" })
                                    )}
                                  </span>

                                  {todo.dueDate && (
                                    <span className="text-xs text-gray-500">
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      {new Date(
                                        todo.dueDate
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p
                                className={`text-gray-600 ${
                                  todo.isCompleted
                                    ? "line-through opacity-75"
                                    : ""
                                }`}
                              >
                                <BilingualText text={todo.description} />
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : showQuiz ? (
                /* Quiz Content */
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t("practice_quiz", {
                      en: "Practice Quiz",
                      ne: "अभ्यास प्रश्नोत्तर",
                    })}
                  </h2>
                  {/* Quiz implementation would go here */}
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Practice Quiz Coming Soon
                    </h3>
                    <p className="text-gray-600">
                      Interactive practice questions will be available here.
                    </p>
                  </div>
                </div>
              ) : (
                /* Lesson Content */
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      <BilingualText text={currentLessonData.title} />
                    </h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 text-lg leading-relaxed">
                        <BilingualText text={currentLessonData.content} />
                      </p>
                    </div>
                  </div>

                  {/* Module Tasks/Todos Section */}
                  {module.todos && module.todos.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-6 mb-6 border-2 border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="h-5 w-5 text-blue-600 mr-2" />
                        {t("module_tasks", {
                          en: "Module Tasks",
                          ne: "मोड्युल कार्यहरू",
                        })}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t("tasks_description", {
                          en: "Complete these tasks to fully master this module:",
                          ne: "यो मोड्युललाई पूर्ण रूपमा मास्टर गर्न यी कार्यहरू पूरा गर्नुहोस्:",
                        })}
                      </p>
                      <div className="space-y-3">
                        {module.todos.map((todo) => {
                          const todoProgress = getTodoProgress(
                            moduleId,
                            todo.id
                          );
                          const isCompleted = todoProgress?.completed || false;

                          return (
                            <div
                              key={todo.id}
                              className={`flex items-start p-4 rounded-lg border-2 transition-all ${
                                isCompleted
                                  ? "bg-green-50 border-green-200"
                                  : "bg-white border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <div className="flex items-center h-5">
                                <input
                                  id={`todo-${todo.id}`}
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={(e) =>
                                    handleTodoToggle(todo.id, e.target.checked)
                                  }
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <label
                                  htmlFor={`todo-${todo.id}`}
                                  className={`text-sm font-medium cursor-pointer ${
                                    isCompleted
                                      ? "text-green-700 line-through"
                                      : "text-gray-900"
                                  }`}
                                >
                                  <BilingualText text={todo.title} />
                                </label>
                                <p
                                  className={`text-xs mt-1 ${
                                    isCompleted
                                      ? "text-green-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  <BilingualText text={todo.description} />
                                </p>
                              </div>
                              {isCompleted && (
                                <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Todo Progress Summary */}
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {t("tasks_progress", {
                              en: "Tasks Progress:",
                              ne: "कार्य प्रगति:",
                            })}
                          </span>
                          <span className="font-medium text-blue-700">
                            {
                              getModuleTodoProgress(moduleId).filter(
                                (p) => p.completed
                              ).length
                            }{" "}
                            / {module.todos.length}{" "}
                            {t("completed", { en: "completed", ne: "पूरा" })}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                module.todos.length > 0
                                  ? (getModuleTodoProgress(moduleId).filter(
                                      (p) => p.completed
                                    ).length /
                                      module.todos.length) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() =>
                        setCurrentLesson(Math.max(0, currentLesson - 1))
                      }
                      disabled={currentLesson === 0}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("previous", { en: "Previous", ne: "अघिल्लो" })}
                    </button>

                    <button
                      onClick={() => handleLessonComplete(currentLesson)}
                      className="btn-primary"
                    >
                      {currentLesson === module.lessons.length - 1
                        ? t("complete_module", {
                            en: "Complete Module",
                            ne: "मोड्युल पूरा गर्नुहोस्",
                          })
                        : t("complete_lesson", {
                            en: "Complete Lesson",
                            ne: "पाठ पूरा गर्नुहोस्",
                          })}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
