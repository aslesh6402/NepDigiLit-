import { useState, useEffect, useCallback } from "react";
import {
  ModuleAnalyticsData,
  ModuleOverallStats,
  ModuleAnalyticsResponse,
} from "../types/dashboard";

export const useModuleAnalytics = (timeframe: string = "week") => {
  const [data, setData] = useState<ModuleAnalyticsResponse>({
    modules: [],
    overallStats: {
      totalModules: 0,
      totalEnrollments: 0,
      totalCompletions: 0,
      averageCompletionRate: 0,
      totalTimeSpent: 0,
      averageModuleScore: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModuleAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/analytics/modules?timeframe=${timeframe}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch module analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching module analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  const exportModuleData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Module Title,Category,Difficulty,Total Enrollments,Completed,In Progress,Not Started,Completion Rate (%),Average Time (min),Average Score (%),Active Users\n" +
      data.modules
        .map(
          (module) =>
            `"${module.title.en}",${module.category},${module.difficulty},${module.totalEnrollments},${module.completedCount},${module.inProgressCount},${module.notStartedCount},${module.completionRate},${module.averageTimeSpent},${module.averageScore},${module.activeUsers}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `module_analytics_${timeframe}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const getEngagementLevel = (
    activeUsers: number,
    totalEnrollments: number
  ) => {
    if (totalEnrollments === 0) return "No Data";
    const engagement = (activeUsers / totalEnrollments) * 100;
    if (engagement >= 70) return "High";
    if (engagement >= 40) return "Medium";
    return "Low";
  };

  const getCompletionTrend = (completionRate: number) => {
    if (completionRate >= 80) return "Excellent";
    if (completionRate >= 60) return "Good";
    if (completionRate >= 40) return "Fair";
    return "Needs Improvement";
  };

  useEffect(() => {
    fetchModuleAnalytics();
  }, [fetchModuleAnalytics]);

  return {
    modules: data.modules,
    overallStats: data.overallStats,
    loading,
    error,
    fetchModuleAnalytics,
    exportModuleData,
    formatDuration,
    getEngagementLevel,
    getCompletionTrend,
  };
};
