"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Exam {
  id: string;
  title: { en: string; ne: string };
  description: { en: string; ne: string };
  moduleId?: string;
  module?: { id: string; title: { en: string; ne: string } };
  totalMarks: number;
  duration: number;
  passingMarks: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  stats?: {
    totalAttempts: number;
    uniqueStudents: number;
    completedAttempts: number;
    flaggedAttempts: number;
    averageScore: number;
    passRate: number;
    cheatingIncidents: number;
  };
}

interface ExamManagementProps {
  modules: any[];
  onCreateExam: () => void;
  onEditExam: (exam: Exam) => void;
}

const ExamManagement: React.FC<ExamManagementProps> = ({
  modules,
  onCreateExam,
  onEditExam,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>("all");

  useEffect(() => {
    fetchExams();
  }, [selectedModule]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const moduleParam =
        selectedModule !== "all" ? `?moduleId=${selectedModule}` : "";
      const response = await fetch(`/api/teacher/exams${moduleParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const response = await fetch(`/api/teacher/exams?id=${examId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setExams(exams.filter((exam) => exam.id !== examId));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete exam");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam");
    }
  };

  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (!exam.isActive) {
      return { label: "Inactive", color: "bg-gray-100 text-gray-800" };
    } else if (now < startDate) {
      return { label: "Scheduled", color: "bg-blue-100 text-blue-800" };
    } else if (now >= startDate && now <= endDate) {
      return { label: "Active", color: "bg-green-100 text-green-800" };
    } else {
      return { label: "Ended", color: "bg-red-100 text-red-800" };
    }
  };

  const getRiskLevel = (flaggedAttempts: number, totalAttempts: number) => {
    if (totalAttempts === 0)
      return { label: "No Data", color: "bg-gray-100 text-gray-800" };

    const riskRatio = flaggedAttempts / totalAttempts;
    if (riskRatio >= 0.3) {
      return { label: "High Risk", color: "bg-red-100 text-red-800" };
    } else if (riskRatio >= 0.1) {
      return { label: "Medium Risk", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Low Risk", color: "bg-green-100 text-green-800" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
          <p className="text-gray-600">
            Create and manage exams for your modules
          </p>
        </div>
        <Button onClick={onCreateExam} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Exam</span>
        </Button>
      </div>

      {/* Filter by Module */}
      <div className="flex items-center space-x-4">
        <label
          htmlFor="moduleFilter"
          className="text-sm font-medium text-gray-700"
        >
          Filter by Module:
        </label>
        <select
          id="moduleFilter"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="all">All Modules</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title?.en || "Untitled Module"}
            </option>
          ))}
        </select>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Exams Found
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first exam to get started with assessments.
            </p>
            <Button onClick={onCreateExam}>Create Exam</Button>
          </div>
        ) : (
          exams.map((exam) => {
            const status = getExamStatus(exam);
            const riskLevel = exam.stats
              ? getRiskLevel(
                  exam.stats.flaggedAttempts,
                  exam.stats.totalAttempts
                )
              : { label: "No Data", color: "bg-gray-100 text-gray-800" };

            return (
              <Card
                key={exam.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {exam.title?.en || "Untitled Exam"}
                    </h3>
                    {exam.module && (
                      <p className="text-sm text-gray-500">
                        Module: {exam.module.title?.en || "Unknown Module"}
                      </p>
                    )}
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {exam.description?.en || "No description available"}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{exam.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    <span>
                      {exam.totalMarks} marks (Pass: {exam.passingMarks})
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(exam.startDate).toLocaleDateString()} -{" "}
                      {new Date(exam.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {exam.stats && (
                  <div className="border-t pt-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Students:</span>
                        <span className="ml-1 font-medium">
                          {exam.stats.uniqueStudents}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Attempts:</span>
                        <span className="ml-1 font-medium">
                          {exam.stats.totalAttempts}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Score:</span>
                        <span className="ml-1 font-medium">
                          {exam.stats.averageScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pass Rate:</span>
                        <span className="ml-1 font-medium">
                          {exam.stats.passRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {exam.stats.flaggedAttempts > 0 && (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-gray-600">
                            {exam.stats.flaggedAttempts} flagged attempts
                          </span>
                        </div>
                        <Badge className={riskLevel.color} variant="outline">
                          {riskLevel.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditExam(exam)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  {exam.stats && exam.stats.totalAttempts > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to exam analytics
                        window.open(`/analytics/exams/${exam.id}`, "_blank");
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteExam(exam.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={exam.stats && exam.stats.totalAttempts > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExamManagement;
