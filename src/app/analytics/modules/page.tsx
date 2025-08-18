"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  BookOpen,
  Award,
  Activity,
  Filter,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useModuleAnalytics } from "@/hooks/useModuleAnalytics";
import { useLanguageStore } from "@/lib/stores/languageStore";
import BilingualText from "@/components/BilingualText";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function ModuleAnalyticsPage() {
  const [timeframe, setTimeframe] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const router = useRouter();

  const {
    modules,
    overallStats,
    loading,
    error,
    fetchModuleAnalytics,
    exportModuleData,
    formatDuration,
    getEngagementLevel,
    getCompletionTrend,
  } = useModuleAnalytics(timeframe);

  const { t } = useLanguageStore();

  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.title.ne.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || module.category === categoryFilter;
    const matchesDifficulty =
      difficultyFilter === "all" || module.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

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

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-blue-600";
    if (rate >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {t("loading_analytics", {
              en: "Loading module analytics...",
              ne: "मोड्युल विश्लेषण लोड गर्दै...",
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
          <BarChart3 className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchModuleAnalytics} className="btn-primary">
            {t("retry", { en: "Try Again", ne: "फेरि कोसिस गर्नुहोस्" })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("back", { en: "Back", ne: "फिर्ता" })}
              </span>
            </button>
          </div>
          <Breadcrumb
            items={[
              {
                label: t("dashboard", { en: "Dashboard", ne: "ड्यासबोर्ड" }),
                href: "/dashboard",
              },
              {
                label: t("module_analytics", {
                  en: "Module Analytics",
                  ne: "मोड्युल विश्लेषण",
                }),
              },
            ]}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("module_analytics", {
                  en: "Module Analytics",
                  ne: "मोड्युल विश्लेषण",
                })}
              </h1>
              <p className="mt-2 text-gray-600">
                {t("module_analytics_description", {
                  en: "Comprehensive insights into module performance and student engagement",
                  ne: "मोड्युल प्रदर्शन र विद्यार्थी सहभागिताको व्यापक अन्तर्दृष्टि",
                })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={exportModuleData}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("export", { en: "Export", ne: "निर्यात" })}
              </button>
              <button
                onClick={fetchModuleAnalytics}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("refresh", { en: "Refresh", ne: "रिफ्रेस" })}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Timeframe Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("timeframe", { en: "Timeframe", ne: "समयावधि" })}
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">
                  {t("past_week", { en: "Past Week", ne: "गत हप्ता" })}
                </option>
                <option value="month">
                  {t("past_month", { en: "Past Month", ne: "गत महिना" })}
                </option>
                <option value="all">
                  {t("all_time", { en: "All Time", ne: "सबै समय" })}
                </option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("search_modules", {
                  en: "Search Modules",
                  ne: "मोड्युल खोज्नुहोस्",
                })}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("search_placeholder", {
                    en: "Search...",
                    ne: "खोज्नुहोस्...",
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("category", { en: "Category", ne: "श्रेणी" })}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  {t("all_categories", {
                    en: "All Categories",
                    ne: "सबै श्रेणीहरू",
                  })}
                </option>
                <option value="DIGITAL_LITERACY">
                  {t("digital_literacy", {
                    en: "Digital Literacy",
                    ne: "डिजिटल साक्षरता",
                  })}
                </option>
                <option value="CYBERSECURITY">
                  {t("cybersecurity", {
                    en: "Cybersecurity",
                    ne: "साइबर सुरक्षा",
                  })}
                </option>
                <option value="DIGITAL_COMMUNICATION">
                  {t("digital_communication", {
                    en: "Digital Communication",
                    ne: "डिजिटल संचार",
                  })}
                </option>
                <option value="DATA_PRIVACY">
                  {t("data_privacy", {
                    en: "Data Privacy",
                    ne: "डाटा गोपनीयता",
                  })}
                </option>
                <option value="ONLINE_ETHICS">
                  {t("online_ethics", {
                    en: "Online Ethics",
                    ne: "अनलाइन नैतिकता",
                  })}
                </option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("difficulty", { en: "Difficulty", ne: "कठिनाई" })}
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  {t("all_levels", { en: "All Levels", ne: "सबै स्तरहरू" })}
                </option>
                <option value="BEGINNER">
                  {t("beginner", { en: "Beginner", ne: "सुरुवाती" })}
                </option>
                <option value="INTERMEDIATE">
                  {t("intermediate", { en: "Intermediate", ne: "मध्यम" })}
                </option>
                <option value="ADVANCED">
                  {t("advanced", { en: "Advanced", ne: "उन्नत" })}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("total_modules", {
                    en: "Total Modules",
                    ne: "कुल मोड्युलहरू",
                  })}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.totalModules}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("total_enrollments", {
                    en: "Total Enrollments",
                    ne: "कुल भर्नाहरू",
                  })}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.totalEnrollments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("completion_rate", {
                    en: "Avg Completion Rate",
                    ne: "औसत पूर्णता दर",
                  })}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.averageCompletionRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("total_time_spent", {
                    en: "Total Time Spent",
                    ne: "कुल समय खर्च",
                  })}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(overallStats.totalTimeSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Analytics Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("module_performance", {
                en: "Module Performance",
                ne: "मोड्युल प्रदर्शन",
              })}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("module", { en: "Module", ne: "मोड्युल" })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("category", { en: "Category", ne: "श्रेणी" })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("enrollments", { en: "Enrollments", ne: "भर्नाहरू" })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("completion_rate", {
                      en: "Completion",
                      ne: "पूर्णता दर",
                    })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("avg_time", { en: "Avg Time", ne: "औसत समय" })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("avg_score", { en: "Avg Score", ne: "औसत अंक" })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("engagement", { en: "Engagement", ne: "सहभागिता" })}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredModules.map((module) => (
                  <tr key={module.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <BilingualText text={module.title} />
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
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
                          <span className="text-xs text-gray-500">
                            {module.duration}{" "}
                            {t("minutes", { en: "min", ne: "मिनेट" })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <BilingualText
                        text={getCategoryDisplayName(module.category)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {module.totalEnrollments}
                      </div>
                      <div className="text-xs text-gray-500">
                        {module.completedCount} completed,{" "}
                        {module.inProgressCount} in progress
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${getCompletionRateColor(
                          module.completionRate
                        )}`}
                      >
                        {module.completionRate}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCompletionTrend(module.completionRate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(module.averageTimeSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {module.averageScore}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {module.activeUsers}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          (
                          {getEngagementLevel(
                            module.activeUsers,
                            module.totalEnrollments
                          )}
                          )
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("no_modules_found", {
                  en: "No Modules Found",
                  ne: "कुनै मोड्युलहरू फेला परेनन्",
                })}
              </h3>
              <p className="text-gray-500">
                {t("try_different_filters", {
                  en: "Try adjusting your search or filter criteria",
                  ne: "आफ्नो खोज वा फिल्टर मापदण्ड समायोजन गर्ने कोशिश गर्नुहोस्",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
