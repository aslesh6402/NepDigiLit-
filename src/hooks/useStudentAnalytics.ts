import { useState, useEffect, useCallback } from "react";
import {
  StudentData,
  ClassStats,
  StudentAnalyticsData,
} from "../types/dashboard";

export const useStudentAnalytics = (timeframe: string = "week") => {
  const [data, setData] = useState<StudentAnalyticsData>({
    students: [],
    classStats: {
      totalStudents: 0,
      activeStudents: 0,
      completedModules: 0,
      averageProgress: 0,
      totalTimeSpent: 0,
      averageScore: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/analytics/students?timeframe=${timeframe}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch student analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching student analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  const exportStudentData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Grade,Modules Completed,Time Spent (min),Progress %,Average Score,Last Active\n" +
      data.students
        .map(
          (student) =>
            `${student.name},${student.grade},${student.modulesCompleted}/${
              student.totalModules
            },${student.timeSpent},${student.progress}%,${
              student.averageScore
            }%,${new Date(student.lastActive).toLocaleDateString()}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `student_progress_${timeframe}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatLastActive = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Less than 1 hour ago";
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getInactiveStudents = useCallback(() => {
    return data.students.filter((student) => !student.isActive);
  }, [data.students]);

  useEffect(() => {
    fetchStudentAnalytics();
  }, [fetchStudentAnalytics]);

  return {
    students: data.students,
    classStats: data.classStats,
    loading,
    error,
    fetchStudentAnalytics,
    exportStudentData,
    formatLastActive,
    getInactiveStudents,
  };
};
