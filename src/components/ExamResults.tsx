"use client";

import React, { useState, useEffect } from "react";
import { Clock, User, AlertTriangle, CheckCircle, X, Eye } from "lucide-react";
import { toast } from "sonner";
import BilingualText from "@/components/BilingualText";
import { useLanguageStore } from "@/lib/stores/languageStore";

interface ExamAttempt {
  id: string;
  userId: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  score: number;
  percentage: number;
  timeSpent: number;
  status: "IN_PROGRESS" | "COMPLETED" | "FLAGGED" | "FAILED";
  riskScore: number;
  tabSwitches: number;
  submittedAt: string;
  cheatingIncidents: CheatingIncident[];
}

interface CheatingIncident {
  id: string;
  incidentType: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  evidence: any;
}

interface Exam {
  id: string;
  title: { en: string; ne: string };
  description: { en: string; ne: string };
  totalMarks: number;
  passingMarks: number;
  duration: number;
  moduleId: string;
  attempts: ExamAttempt[];
}

interface ExamResultsProps {
  examId: string;
  isTeacher?: boolean;
}

const ExamResults: React.FC<ExamResultsProps> = ({
  examId,
  isTeacher = false,
}) => {
  const { t } = useLanguageStore();
  const [exam, setExam] = useState<Exam | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);

  useEffect(() => {
    fetchExamResults();
  }, [examId]);

  const fetchExamResults = async () => {
    try {
      const response = await fetch(`/api/teacher/exams/${examId}/results`);
      if (response.ok) {
        const data = await response.json();
        setExam(data.exam);
      }
    } catch (error) {
      console.error("Failed to fetch exam results:", error);
      toast.error("Failed to load exam results");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FLAGGED":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No exam data found</p>
      </div>
    );
  }

  const completedAttempts = exam.attempts.filter(
    (a) => a.status === "COMPLETED" || a.status === "FLAGGED"
  );
  const flaggedAttempts = exam.attempts.filter(
    (a) => a.status === "FLAGGED" || a.riskScore > 50
  );
  const averageScore =
    completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + a.score, 0) /
        completedAttempts.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Exam Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            <BilingualText text={exam.title} />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {exam.attempts.length}
            </div>
            <div className="text-sm text-blue-800">Total Attempts</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {completedAttempts.length}
            </div>
            <div className="text-sm text-green-800">Completed</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {flaggedAttempts.length}
            </div>
            <div className="text-sm text-orange-800">Flagged</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(averageScore)}
            </div>
            <div className="text-sm text-purple-800">Avg Score</div>
          </div>
        </div>
      </div>

      {/* Attempts List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Student Attempts
          </h3>
        </div>

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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incidents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exam.attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attempt.student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {attempt.score}/{exam.totalMarks}
                    </div>
                    <div className="text-sm text-gray-500">
                      {attempt.percentage}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {formatTime(attempt.timeSpent)}
                    </div>
                    {attempt.tabSwitches > 0 && (
                      <div className="text-xs text-orange-600">
                        {attempt.tabSwitches} tab switches
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attempt.cheatingIncidents.length > 0 ? (
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                        <span className="text-sm text-red-600">
                          {attempt.cheatingIncidents.length} incidents
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-sm text-green-600">Clean</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedAttempt(attempt)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attempt Details Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Attempt Details - {selectedAttempt.student.name}
                </h3>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Attempt Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Score</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {selectedAttempt.score}/{exam.totalMarks} (
                    {selectedAttempt.percentage}%)
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Risk Score</div>
                  <div
                    className={`text-xl font-semibold ${
                      selectedAttempt.riskScore > 70
                        ? "text-red-600"
                        : selectedAttempt.riskScore > 40
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedAttempt.riskScore}/100
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Time Spent</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {formatTime(selectedAttempt.timeSpent)}
                  </div>
                </div>
              </div>

              {/* Cheating Incidents */}
              {selectedAttempt.cheatingIncidents.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Cheating Incidents (
                    {selectedAttempt.cheatingIncidents.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedAttempt.cheatingIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                                incident.severity
                              )}`}
                            >
                              {incident.severity}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {incident.incidentType.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(incident.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {incident.description}
                        </p>
                        {incident.evidence && (
                          <div className="mt-2 text-xs text-gray-500">
                            <strong>Evidence:</strong>{" "}
                            {JSON.stringify(incident.evidence, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Summary */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Activity Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAttempt.tabSwitches}
                    </div>
                    <div className="text-sm text-gray-500">Tab Switches</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAttempt.status === "COMPLETED" ? "Yes" : "No"}
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(
                        selectedAttempt.submittedAt
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">Submitted</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAttempt.percentage >=
                      (exam.passingMarks / exam.totalMarks) * 100
                        ? "Passed"
                        : "Failed"}
                    </div>
                    <div className="text-sm text-gray-500">Result</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResults;
