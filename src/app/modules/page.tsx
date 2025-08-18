"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";
import {
  Clock,
  BookOpen,
  CheckCircle,
  Loader2,
  AlertCircle,
  Play,
  Trophy,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/lib/stores/userStore";
import { useProgressStore } from "@/lib/stores/progressStore";
import { useOfflineStore } from "@/lib/stores/offlineStore";
import { useLanguageStore } from "@/lib/stores/languageStore";
import { useModules } from "@/hooks/useModules";
import {
  getModuleIcon,
  getModuleColor,
  initializeModules,
} from "@/lib/moduleData";
import BilingualText from "@/components/BilingualText";

interface Exam {
  id: string;
  title: { en: string; ne: string } | string;
  description: { en: string; ne: string } | string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  maxAttempts: number;
  endDate: string;
  module?: {
    id: string;
    title: { en: string; ne: string } | string;
  };
  userStats?: {
    attemptCount: number;
    completedAttempts: number;
    canAttempt: boolean;
    bestScore: number | null;
    hasPassed?: boolean;
  };
}

interface ExamsByModule {
  [moduleId: string]: {
    module: any;
    exams: Exam[];
  };
}

export default function ModulesPage() {
  const { user, logout } = useUserStore();
  const router = useRouter();
  const { getModuleProgress } = useProgressStore();
  const { downloadModule, getOfflineModule } = useOfflineStore();
  const { t, language } = useLanguageStore();
  const { modules, loading, error, fetchModules } = useModules();
  const [initializing, setInitializing] = useState(false);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [examsByModule, setExamsByModule] = useState<ExamsByModule>({});
  const [loadingExams, setLoadingExams] = useState(true);
  const [showExams, setShowExams] = useState(false);

  // Initialize modules if none exist
  useEffect(() => {
    const handleInitialization = async () => {
      if (!loading && modules.length === 0 && !error) {
        setInitializing(true);
        try {
          await initializeModules();
          await fetchModules();
        } catch (error) {
          console.error("Failed to initialize modules:", error);
        } finally {
          setInitializing(false);
        }
      }
    };

    handleInitialization();
  }, [loading, modules.length, error]);

  // Fetch available exams for students
  useEffect(() => {
    if (user && user.role === "STUDENT") {
      fetchAvailableExams();
    }
  }, [user, modules]); // Add modules as dependency to re-map when modules are loaded

  const fetchAvailableExams = async () => {
    if (!user) return;

    try {
      setLoadingExams(true);
      const response = await fetch(`/api/student/exams?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const exams = data.exams || [];
        console.log("Fetched exams:", exams); // Debug log
        setAvailableExams(exams);

        // Group exams by module
        const grouped: ExamsByModule = {};

        exams.forEach((exam: Exam) => {
          console.log("Processing exam:", exam.id, exam.title, exam.module); // Debug log
          if (exam.module && exam.module.id) {
            const moduleId = exam.module.id;
            if (!grouped[moduleId]) {
              const moduleData = modules.find((m) => m.id === moduleId);
              grouped[moduleId] = {
                module: moduleData || {
                  id: exam.module.id,
                  title: exam.module.title || {
                    en: "Unknown Module",
                    ne: "अज्ञात मोड्युल",
                  },
                  description: { en: "", ne: "" },
                  category: "",
                  difficulty: "",
                },
                exams: [],
              };
            }
            grouped[moduleId].exams.push(exam);
          } else {
            // Handle exams without module assignment
            console.log("Exam without module:", exam.id, exam.title); // Debug log
            const unmappedKey = "unassigned";
            if (!grouped[unmappedKey]) {
              grouped[unmappedKey] = {
                module: {
                  id: unmappedKey,
                  title: { en: "Unassigned Exams", ne: "अवर्गीकृत परीक्षाहरू" },
                  description: {
                    en: "Exams not assigned to any module",
                    ne: "कुनै मोड्युलमा नदिइएका परीक्षाहरू",
                  },
                  category: "GENERAL",
                  difficulty: "BEGINNER",
                },
                exams: [],
              };
            }
            grouped[unmappedKey].exams.push(exam);
          }
        });

        console.log("Grouped exams by module:", grouped); // Debug log
        setExamsByModule(grouped);
      } else {
        console.error(
          "Failed to fetch exams:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    } finally {
      setLoadingExams(false);
    }
  };

  // Re-map exams when modules are loaded
  const remapExamsByModule = () => {
    if (availableExams.length === 0) return;

    const grouped: ExamsByModule = {};

    availableExams.forEach((exam: Exam) => {
      console.log("Re-mapping exam:", exam.id, exam.title, exam.module); // Debug log
      if (exam.module && exam.module.id) {
        const moduleId = exam.module.id;
        if (!grouped[moduleId]) {
          const moduleData = modules.find((m) => m.id === moduleId);
          grouped[moduleId] = {
            module: moduleData || {
              id: exam.module.id,
              title: exam.module.title || {
                en: "Unknown Module",
                ne: "अज्ञात मोड्युल",
              },
              description: { en: "", ne: "" },
              category: "",
              difficulty: "",
            },
            exams: [],
          };
        }
        grouped[moduleId].exams.push(exam);
      } else {
        // Handle exams without module assignment
        console.log("Exam without module:", exam.id, exam.title); // Debug log
        const unmappedKey = "unassigned";
        if (!grouped[unmappedKey]) {
          grouped[unmappedKey] = {
            module: {
              id: unmappedKey,
              title: { en: "Unassigned Exams", ne: "अवर्गीकृत परीक्षाहरू" },
              description: {
                en: "Exams not assigned to any module",
                ne: "कुनै मोड्युलमा नदिइएका परीक्षाहरू",
              },
              category: "GENERAL",
              difficulty: "BEGINNER",
            },
            exams: [],
          };
        }
        grouped[unmappedKey].exams.push(exam);
      }
    });

    console.log("Re-mapped exams by module:", grouped); // Debug log
    setExamsByModule(grouped);
  };

  // Re-map exams when modules are loaded
  useEffect(() => {
    if (modules.length > 0 && availableExams.length > 0) {
      remapExamsByModule();
    }
  }, [modules, availableExams]);

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "DIGITAL_LITERACY":
        return { en: "Digital Literacy", ne: "डिजिटल साक्षरता" };
      case "CYBERSECURITY":
        return { en: "Cybersecurity", ne: "साइबर सुरक्षा" };
      case "DIGITAL_COMMUNICATION":
        return { en: "Digital Communication", ne: "डिजिटल संचार" };
      case "DATA_PRIVACY":
        return { en: "Data Privacy", ne: "डाटा गोपनीयता" };
      case "ONLINE_ETHICS":
        return { en: "Online Ethics", ne: "अनलाइन नैतिकता" };
      default:
        return { en: "Digital Learning", ne: "डिजिटल सिकाइ" };
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-yellow-100 text-yellow-800";
      case "ADVANCED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {initializing
              ? t("initializing_modules", {
                  en: "Initializing modules...",
                  ne: "मोड्युलहरू सुरु गर्दै...",
                })
              : t("loading_modules", {
                  en: "Loading modules...",
                  ne: "मोड्युलहरू लोड गर्दै...",
                })}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => fetchModules()} className="btn-primary">
            {t("retry", { en: "Try Again", ne: "फेरि कोसिस गर्नुहोस्" })}
          </button>
        </div>
      </div>
    );
  }

  const getDisplayText = (text: string | { en: string; ne: string }) => {
    if (typeof text === "string") {
      return text;
    }
    return text[language] || text.en;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("learning_modules", {
                en: "Learning Modules",
                ne: "सिकाइ मोड्युलहरू",
              })}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("modules_description", {
                en: "Comprehensive digital literacy and cybersecurity courses designed specifically for students in Bagmati Province.",
                ne: "बागमती प्रदेशका विद्यार्थीहरूका लागि विशेष रूपमा डिजाइन गरिएका व्यापक डिजिटल साक्षरता र साइबर सुरक्षा पाठ्यक्रमहरू।",
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.length === 0 && !loading && !initializing ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("no_modules", {
                    en: "No Modules Available",
                    ne: "कुनै मोड्युलहरू उपलब्ध छैनन्",
                  })}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("no_modules_description", {
                    en: "Learning modules will be available soon. Please check back later.",
                    ne: "सिकाइ मोड्युलहरू चाँडै उपलब्ध हुनेछन्। कृपया पछि फेरि जाँच गर्नुहोस्।",
                  })}
                </p>
                <button onClick={() => fetchModules()} className="btn-primary">
                  {t("refresh", { en: "Refresh", ne: "रिफ्रेस गर्नुहोस्" })}
                </button>
              </div>
            ) : (
              modules.map((module, index) => {
                const Icon = getModuleIcon(module.category);
                const progress = getModuleProgress(module.id);
                const offlineModule = getOfflineModule(module.id);
                const moduleColor = getModuleColor(index);
                const categoryDisplay = getCategoryDisplayName(module.category);

                return (
                  <div
                    key={module.id}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`inline-flex items-center justify-center w-12 h-12 ${moduleColor} rounded-lg text-white`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                              module.difficulty
                            )}`}
                          >
                            {t(module.difficulty.toLowerCase(), {
                              en: module.difficulty,
                              ne:
                                module.difficulty === "BEGINNER"
                                  ? "सुरुवाती"
                                  : module.difficulty === "INTERMEDIATE"
                                  ? "मध्यम"
                                  : "उन्नत",
                            })}
                          </span>
                          {offlineModule && (
                            <CheckCircle
                              className="h-4 w-4 text-green-600"
                              // title="Downloaded for offline use"
                            />
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        <BilingualText text={module.title} />
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        <BilingualText text={module.description} />
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {module.duration}{" "}
                            {t("minutes", { en: "min", ne: "मिनेट" })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>
                            {module.lessons?.length || 0}{" "}
                            {t("lessons", { en: "lessons", ne: "पाठहरू" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">
                          <BilingualText text={categoryDisplay} />
                        </span>
                        {progress && (
                          <div className="flex items-center space-x-2">
                            {progress.completed ? (
                              <span className="text-sm text-green-600 font-medium">
                                {t("completed", {
                                  en: "Completed",
                                  ne: "पूरा भयो",
                                })}
                              </span>
                            ) : (
                              <span className="text-sm text-blue-600 font-medium">
                                {t("in_progress", {
                                  en: "In Progress",
                                  ne: "प्रगतिमा",
                                })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {progress && !progress.completed && (
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (progress.timeSpent / 30) * 100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Link
                          href={`/modules/${module.id}`}
                          className="flex-1 btn-primary text-center"
                        >
                          {t("start_learning", {
                            en: "Start Learning",
                            ne: "सिक्न सुरु गर्नुहोस्",
                          })}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Exams Section for Students */}
          {user && user.role === "STUDENT" && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {t("module_exams", {
                      en: "Module Exams",
                      ne: "मोड्युल परीक्षाहरू",
                    })}
                  </h2>
                  <p className="text-gray-600">
                    {t("exams_description", {
                      en: "Test your knowledge with module-specific exams",
                      ne: "मोड्युल-विशिष्ट परीक्षाहरूबाट आफ्नो ज्ञान परीक्षण गर्नुहोस्",
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExams(!showExams);
                    if (!showExams) fetchAvailableExams();
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {showExams
                    ? t("hide_exams", {
                        en: "Hide Exams",
                        ne: "परीक्षाहरू लुकाउनुहोस्",
                      })
                    : t("show_exams", {
                        en: "Show Exams",
                        ne: "परीक्षाहरू देखाउनुहोस्",
                      })}
                </Button>
              </div>

              {showExams && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {t("available_exams", {
                          en: "Available Exams by Module",
                          ne: "मोड्युल अनुसार उपलब्ध परीक्षाहरू",
                        })}
                      </span>
                      <div className="flex flex-col items-end text-sm font-normal text-gray-500">
                        <span>
                          {availableExams.length}{" "}
                          {t("total_exams", {
                            en: "total exams",
                            ne: "कुल परीक्षाहरू",
                          })}
                        </span>
                        <span className="text-xs">
                          {Object.values(examsByModule).reduce(
                            (total, moduleGroup) =>
                              total + moduleGroup.exams.length,
                            0
                          )}{" "}
                          {t("mapped_exams", {
                            en: "mapped",
                            ne: "मापदण्ड",
                          })}
                        </span>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {t("exams_subtitle", {
                        en: "Take exams to test your knowledge on each module",
                        ne: "प्रत्येक मोड्युलमा आफ्नो ज्ञान परीक्षण गर्न परीक्षाहरू लिनुहोस्",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingExams ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">
                          {t("loading_exams", {
                            en: "Loading exams...",
                            ne: "परीक्षाहरू लोड गर्दै...",
                          })}
                        </p>
                      </div>
                    ) : Object.keys(examsByModule).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>
                          {t("no_exams", {
                            en: "No exams available at the moment",
                            ne: "अहिले कुनै परीक्षाहरू उपलब्ध छैनन्",
                          })}
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={fetchAvailableExams}
                        >
                          {t("refresh_exams", {
                            en: "Refresh Exams",
                            ne: "परीक्षाहरू रिफ्रेश गर्नुहोस्",
                          })}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(examsByModule).map(
                          ([moduleId, { module, exams }]) => (
                            <div
                              key={moduleId}
                              className="border border-gray-200 rounded-lg p-6"
                            >
                              <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                                  <div className="flex items-center">
                                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                                    {getDisplayText(module.title)}
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                      {
                                        exams.filter(
                                          (e) => e.userStats?.canAttempt
                                        ).length
                                      }{" "}
                                      {t("available", {
                                        en: "available",
                                        ne: "उपलब्ध",
                                      })}
                                    </span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                      {
                                        exams.filter(
                                          (e) =>
                                            e.userStats &&
                                            e.userStats.completedAttempts > 0
                                        ).length
                                      }{" "}
                                      {t("attempted", {
                                        en: "attempted",
                                        ne: "प्रयास गरिएको",
                                      })}
                                    </span>
                                  </div>
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {exams.length}{" "}
                                  {t("exam", { en: "exam", ne: "परीक्षा" })}
                                  {exams.length !== 1 ? "s" : ""}{" "}
                                  {t("in_this_module", {
                                    en: "in this module",
                                    ne: "यस मोड्युलमा",
                                  })}
                                </p>
                              </div>
                              <div className="space-y-3">
                                {exams.map((exam) => (
                                  <div
                                    key={exam.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">
                                        {getDisplayText(exam.title)}
                                      </h4>
                                      <div className="flex items-center space-x-4 mt-1">
                                        <span className="text-sm text-gray-600">
                                          <Clock className="h-4 w-4 inline mr-1" />
                                          {exam.duration}{" "}
                                          {t("min", { en: "min", ne: "मिनेट" })}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                          <Trophy className="h-4 w-4 inline mr-1" />
                                          {exam.totalMarks}{" "}
                                          {t("marks", {
                                            en: "marks",
                                            ne: "अंकहरू",
                                          })}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                          <Calendar className="h-4 w-4 inline mr-1" />
                                          {t("due", {
                                            en: "Due",
                                            ne: "अन्तिम मिति",
                                          })}
                                          :{" "}
                                          {new Date(
                                            exam.endDate
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                      {exam.userStats && (
                                        <div className="mt-2">
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full ${
                                              exam.userStats.canAttempt
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {exam.userStats.attemptCount}/
                                            {exam.maxAttempts}{" "}
                                            {t("attempts_used", {
                                              en: "attempts used",
                                              ne: "प्रयासहरू प्रयोग गरियो",
                                            })}
                                          </span>
                                          {exam.userStats.bestScore !==
                                            null && (
                                            <span className="ml-2 text-xs text-gray-600">
                                              {t("best", {
                                                en: "Best",
                                                ne: "उत्तम",
                                              })}
                                              : {exam.userStats.bestScore}%
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
                                    </div>
                                    <Button
                                      size="sm"
                                      className="ml-4"
                                      disabled={!exam.userStats?.canAttempt}
                                      onClick={() => {
                                        window.open(
                                          `/exams/${exam.id}`,
                                          "_blank"
                                        );
                                      }}
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
                                          {t("unavailable", {
                                            en: "Unavailable",
                                            ne: "अनुपलब्ध",
                                          })}
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => router.push("/exams")}
                          >
                            {t("view_all_exams", {
                              en: "View All Exams",
                              ne: "सबै परीक्षाहरू हेर्नुहोस्",
                            })}{" "}
                            ({availableExams.length})
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
