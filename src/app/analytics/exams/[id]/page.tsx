"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  Eye,
  Flag,
} from "lucide-react";
import { useLanguageStore } from "@/lib/stores/languageStore";
import { useUserStore } from "@/lib/stores/userStore";
import BilingualText from "@/components/BilingualText";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface CheatingIncident {
  id: string;
  incidentType: string;
  severity: string;
  description: string;
  timestamp: string;
}

interface ExamAttempt {
  id: string;
  userId: string;
  student: Student;
  score: number;
  percentage: number;
  timeSpent: number;
  status: string;
  riskScore: number;
  tabSwitches: number;
  submittedAt: string;
  cheatingIncidents: CheatingIncident[];
}

interface ExamData {
  id: string;
  title: { en: string; ne: string };
  description: { en: string; ne: string };
  totalMarks: number;
  passingMarks: number;
  duration: number;
  startDate: string;
  endDate: string;
  attempts: ExamAttempt[];
  module?: {
    id: string;
    title: { en: string; ne: string };
  };
  analytics?: {
    totalAttempts: number;
    completedAttempts: number;
    passedAttempts: number;
    passRate: number;
    failedAttempts: number;
    totalIncidents: number;
    avgScore: number;
    avgTimeSpent: number;
    scoreDistribution?: any;
    riskScoreDistribution?: any;
  };
}

export default function ExamAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "attempts" | "incidents"
  >("overview");

  useEffect(() => {
    fetchExamResults();
  }, [examId]);

  const fetchExamResults = async () => {
    try {
      // Try the analytics API first, fallback to teacher API if needed
      let response = await fetch(`/api/analytics/exams/${examId}`);

      if (!response.ok && response.status === 401) {
        // If analytics API requires auth and fails, try teacher API
        response = await fetch(`/api/teacher/exams/${examId}/results`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load exam results");
      }

      setExamData(data.exam);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load exam results"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!examData) return null;

    // If analytics data is included in the response, use it
    if (examData.analytics) {
      return examData.analytics;
    }

    // Otherwise calculate manually (fallback)
    const attempts = examData.attempts;
    const completedAttempts = attempts.filter((a) => a.status === "COMPLETED");
    const passedAttempts = completedAttempts.filter(
      (a) => a.score >= examData.passingMarks
    );
    const failedAttempts = attempts.filter((a) => a.status === "FAILED");
    const totalIncidents = attempts.reduce(
      (sum, a) => sum + a.cheatingIncidents.length,
      0
    );

    const avgScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + a.percentage, 0) /
          completedAttempts.length
        : 0;

    const avgTimeSpent =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + a.timeSpent, 0) /
          completedAttempts.length
        : 0;

    return {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      passedAttempts: passedAttempts.length,
      passRate:
        completedAttempts.length > 0
          ? (passedAttempts.length / completedAttempts.length) * 100
          : 0,
      failedAttempts: failedAttempts.length,
      totalIncidents,
      avgScore: Math.round(avgScore),
      avgTimeSpent: Math.round(avgTimeSpent / 60), // Convert to minutes
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-100";
      case "FLAGGED":
        return "text-orange-600 bg-orange-100";
      case "FAILED":
        return "text-red-600 bg-red-100";
      case "IN_PROGRESS":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam analytics...</p>
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
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/modules"); // or your desired fallback route
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!examData) return null;

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/dashboard");
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <BilingualText text={examData.title} />
                </h1>
                <p className="text-sm text-gray-600">
                  Exam Analytics & Results
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Attempts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalAttempts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.passRate)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgScore}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.failedAttempts}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setSelectedTab("overview")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === "overview"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setSelectedTab("attempts")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === "attempts"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Attempts ({stats.totalAttempts})
                </button>
                <button
                  onClick={() => setSelectedTab("incidents")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === "incidents"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Incidents ({stats.totalIncidents})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {selectedTab === "overview" && (
                <div className="space-y-6">
                  {/* Exam Details */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Exam Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">
                          {examData.duration} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Marks</p>
                        <p className="font-medium">{examData.totalMarks}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Passing Marks</p>
                        <p className="font-medium">{examData.passingMarks}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Average Time Spent
                        </p>
                        <p className="font-medium">
                          {stats.avgTimeSpent} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "attempts" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {examData.attempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {attempt.student.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {attempt.student.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {attempt.score}/{examData.totalMarks}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attempt.percentage}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(attempt.timeSpent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                attempt.status
                              )}`}
                            >
                              {attempt.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm font-medium ${
                                attempt.riskScore > 70
                                  ? "text-red-600"
                                  : attempt.riskScore > 40
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {attempt.riskScore}/100
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(attempt.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTab === "incidents" && (
                <div className="space-y-4">
                  {examData.attempts
                    .filter((attempt) => attempt.cheatingIncidents.length > 0)
                    .map((attempt) => (
                      <div
                        key={attempt.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            {attempt.student.name}
                          </h4>
                          <span className="text-sm text-gray-500">
                            Risk Score: {attempt.riskScore}/100
                          </span>
                        </div>
                        <div className="space-y-2">
                          {attempt.cheatingIncidents.map((incident) => (
                            <div
                              key={incident.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {incident.incidentType.replace(/_/g, " ")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {incident.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                                    incident.severity
                                  )}`}
                                >
                                  {incident.severity}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    incident.timestamp
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                  {examData.attempts.every(
                    (attempt) => attempt.cheatingIncidents.length === 0
                  ) && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No cheating incidents detected</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
