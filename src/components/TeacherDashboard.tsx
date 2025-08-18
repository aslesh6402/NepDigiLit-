"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "./Header";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Download,
  Calendar,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Target,
} from "lucide-react";
import ModuleForm from "./ModuleForm";
import ExamManagement from "./ExamManagement";
import ExamForm from "./ExamForm";
import { useStudentAnalytics } from "../hooks/useStudentAnalytics";
import { useModules } from "../hooks/useModules";
import { useUserStore } from "@/lib/stores/userStore";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeacherDashboardProps {
  // No props needed - user info comes from auth context
}

interface AnalyticsData {
  todos: {
    total: number;
    totalAssignments: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  quizzes: {
    total: number;
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    passRate: number;
  };
  exams: {
    total: number;
    totalAttempts: number;
    completedAttempts: number;
    flaggedAttempts: number;
    averageScore: number;
    passRate: number;
    cheatingIncidents: number;
    highRiskAttempts: number;
  };
  cheating: {
    totalIncidents: number;
    recentIncidents: Array<{
      id: string;
      incidentType: string;
      description: string;
      severity: string;
      timestamp: string;
      user: { name: string; email: string };
    }>;
    incidentsByType: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
  };
}

interface StudentPerformance {
  id: string;
  name: string;
  email: string;
  todosCompleted: number;
  todosTotal: number;
  todoCompletionRate: number;
  quizAttempts: number;
  quizAvgScore: number;
  examAttempts: number;
  examAvgScore: number;
  cheatingIncidents: number;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = () => {
  const { user } = useUserStore();
  const isAuthenticated = !!user;
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [isExamFormOpen, setIsExamFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<
    StudentPerformance[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");

  // Custom hooks for data management - MUST be called before any conditional returns
  const {
    students,
    classStats,
    loading: studentsLoading,
    exportStudentData,
    formatLastActive,
    getInactiveStudents,
  } = useStudentAnalytics(selectedTimeframe);

  const {
    modules: moduleAnalytics,
    loading: modulesLoading,
    saveModule,
    deleteModule,
  } = useModules(true); // Pass true for teacher view

  const loading = studentsLoading || modulesLoading || analyticsLoading;
  const inactiveStudents = getInactiveStudents();

  useEffect(() => {
    if (user && user.role === "TEACHER") {
      fetchAnalytics();
    }
  }, [user, selectedTimeRange]);

  // Check if user is authenticated and is a teacher - AFTER all hooks are called
  if (!isAuthenticated || !user || user.role !== "TEACHER") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">Teacher access required</p>
        </div>
      </div>
    );
  }

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem("auth-token");

      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch(
        `/api/teacher/analytics?timeRange=${selectedTimeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data.analytics);
        setStudentPerformance(data.studentPerformance);
        setRecentActivity(data.recentActivity);
      } else {
        console.error("Analytics API error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLevel = (incidents: number) => {
    if (incidents >= 5)
      return { label: "High Risk", color: "bg-red-100 text-red-800" };
    if (incidents >= 2)
      return { label: "Medium Risk", color: "bg-yellow-100 text-yellow-800" };
    if (incidents >= 1)
      return { label: "Low Risk", color: "bg-orange-100 text-orange-800" };
    return { label: "No Risk", color: "bg-green-100 text-green-800" };
  };

  const handleCreateModule = () => {
    setEditingModule(null);
    setIsModuleFormOpen(true);
  };

  const handleEditModule = (module: any) => {
    setEditingModule(module);
    setIsModuleFormOpen(true);
  };

  const handleSaveModule = async (moduleData: any) => {
    try {
      await saveModule(moduleData);
      setIsModuleFormOpen(false);
      setEditingModule(null);
    } catch (error) {
      console.error("Error saving module:", error);
      throw error;
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm("Are you sure you want to delete this module?")) {
      try {
        await deleteModule(moduleId);
      } catch (error) {
        console.error("Error deleting module:", error);
        alert("Failed to delete module. Please try again.");
      }
    }
  };

  const handleSaveExam = async (examData: any) => {
    try {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch(
        editingExam
          ? `/api/teacher/exams/${editingExam.id}`
          : "/api/teacher/exams",
        {
          method: editingExam ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(examData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Exam saved successfully:", result);
        setIsExamFormOpen(false);
        setEditingExam(null);
        // Refresh analytics data
        fetchAnalytics();
      } else {
        console.error("Error saving exam:", result.error);
        alert("Failed to save exam. Please try again.");
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      alert("Failed to save exam. Please try again.");
    }
  };

  const handleCreateTodo = () => {
    // TODO: Implement todo creation
    alert("Todo creation feature will be implemented soon!");
  };

  const handleCreateQuiz = () => {
    // TODO: Implement quiz creation
    console.log("Create Quiz functionality - to be implemented");
    alert("Quiz creation feature will be implemented soon!");
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor student progress and manage learning modules
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/analytics/modules"
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Module Analytics
              </Link>
              <button
                onClick={handleCreateModule}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Module
              </button>
              <button
                onClick={() => setIsExamFormOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </button>
            </div>
          </div>
        </div>

        {/* Class Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Students
                </p>
                <div className="text-3xl font-bold text-blue-600">
                  {classStats.totalStudents}
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active This{" "}
                  {selectedTimeframe === "week"
                    ? "Week"
                    : selectedTimeframe === "month"
                    ? "Month"
                    : "Period"}
                </p>
                <div className="text-3xl font-bold text-green-600">
                  {classStats.activeStudents}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Modules Completed
                </p>
                <div className="text-3xl font-bold text-purple-600">
                  {classStats.completedModules}
                </div>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Progress
                </p>
                <div className="text-3xl font-bold text-orange-600">
                  {classStats.averageProgress}%
                </div>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Student Performance</TabsTrigger>
            <TabsTrigger value="exams">Exam Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Todos Overview */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Todo Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Assignments:</span>
                    <span className="font-semibold">
                      {analytics?.todos?.totalAssignments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="text-green-600 font-semibold">
                      {analytics?.todos?.completed || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="text-orange-600 font-semibold">
                      {analytics?.todos?.pending || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue:</span>
                    <span className="text-red-600 font-semibold">
                      {analytics?.todos?.overdue || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (analytics?.todos?.totalAssignments || 0) > 0
                            ? ((analytics?.todos?.completed || 0) /
                                (analytics?.todos?.totalAssignments || 1)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </Card>

              {/* Quiz Overview */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quiz Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Attempts:</span>
                    <span className="font-semibold">
                      {analytics?.quizzes?.totalAttempts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="text-green-600 font-semibold">
                      {analytics?.quizzes?.completedAttempts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Score:</span>
                    <span className="font-semibold">
                      {analytics?.quizzes?.averageScore || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pass Rate:</span>
                    <span className="text-blue-600 font-semibold">
                      {analytics?.quizzes?.passRate || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${analytics?.quizzes?.passRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              {/* Exam Overview */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Exam Security</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Attempts:</span>
                    <span className="font-semibold">
                      {analytics?.exams?.totalAttempts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="text-green-600 font-semibold">
                      {analytics?.exams?.completedAttempts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flagged:</span>
                    <span className="text-red-600 font-semibold">
                      {analytics?.exams?.flaggedAttempts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incidents:</span>
                    <span className="text-orange-600 font-semibold">
                      {analytics?.exams?.cheatingIncidents || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Security Score:</span>
                    <span
                      className={`font-semibold ${
                        (analytics?.exams?.cheatingIncidents || 0) === 0
                          ? "text-green-600"
                          : (analytics?.exams?.cheatingIncidents || 0) < 5
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {(analytics?.exams?.cheatingIncidents || 0) === 0
                        ? "Excellent"
                        : (analytics?.exams?.cheatingIncidents || 0) < 5
                        ? "Good"
                        : "Needs Attention"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Student Performance Ranking
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Student</th>
                      <th className="text-center py-2">Todos</th>
                      <th className="text-center py-2">Quiz Avg</th>
                      <th className="text-center py-2">Exam Avg</th>
                      <th className="text-center py-2">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPerformance.map((student, index) => {
                      const risk = getRiskLevel(student.cheatingIncidents);
                      return (
                        <tr
                          key={student.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-gray-500 text-xs">
                                {student.email}
                              </p>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <div className="flex flex-col items-center">
                              <span className="font-semibold">
                                {student.todoCompletionRate}%
                              </span>
                              <span className="text-xs text-gray-500">
                                {student.todosCompleted}/{student.todosTotal}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <span className="font-semibold">
                              {student.quizAvgScore}%
                            </span>
                            <div className="text-xs text-gray-500">
                              {student.quizAttempts} attempts
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <span className="font-semibold">
                              {student.examAvgScore}%
                            </span>
                            <div className="text-xs text-gray-500">
                              {student.examAttempts} attempts
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <Badge className={risk.color}>{risk.label}</Badge>
                            {student.cheatingIncidents > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                {student.cheatingIncidents} incidents
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="space-y-4">
            <ExamManagement
              modules={moduleAnalytics}
              onCreateExam={() => {
                setEditingExam(null);
                setIsExamFormOpen(true);
              }}
              onEditExam={(exam) => {
                setEditingExam(exam);
                setIsExamFormOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="exam-results" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Exam Results & Security */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Exam Results & Security
                </h3>
                <div className="space-y-4">
                  {analytics && analytics.exams && analytics.exams.total > 0 ? (
                    recentActivity
                      .filter((activity) => activity.type === "exam")
                      .map((exam) => (
                        <div
                          key={exam.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {typeof exam.title === "string"
                                ? exam.title
                                : exam.title?.en || exam.title?.ne || "Exam"}
                            </h4>
                            <div className="flex space-x-2">
                              <Badge
                                variant={
                                  exam.stats?.flaggedAttempts > 0
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {exam.stats?.flaggedAttempts || 0} flagged
                              </Badge>
                              <Badge variant="outline">
                                {exam.stats?.totalAttempts || 0} attempts
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-lg font-semibold text-blue-600">
                                {exam.stats?.completedAttempts || 0}
                              </div>
                              <div className="text-xs text-blue-800">
                                Completed
                              </div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="text-lg font-semibold text-green-600">
                                {Math.round(exam.stats?.averageScore || 0)}%
                              </div>
                              <div className="text-xs text-green-800">
                                Avg Score
                              </div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="text-lg font-semibold text-orange-600">
                                {exam.stats?.flaggedAttempts || 0}
                              </div>
                              <div className="text-xs text-orange-800">
                                Flagged
                              </div>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <div className="text-lg font-semibold text-red-600">
                                {exam.stats?.cheatingIncidents || 0}
                              </div>
                              <div className="text-xs text-red-800">
                                Incidents
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              window.open(
                                `/teacher/exams/${exam.id}/results`,
                                "_blank"
                              )
                            }
                            variant="outline"
                            size="sm"
                          >
                            View Detailed Results
                          </Button>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No exams found. Create an exam to see results here.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cheating" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incident Types */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Incident Types</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.cheating.incidentsByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">
                          {type.replace(/_/g, " ")}
                        </span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    )
                  )}
                </div>
              </Card>

              {/* Severity Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Severity Distribution
                </h3>
                <div className="space-y-2">
                  {Object.entries(analytics.cheating.incidentsBySeverity).map(
                    ([severity, count]) => (
                      <div
                        key={severity}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm capitalize">{severity}</span>
                        <Badge className={getSeverityColor(severity)}>
                          {count}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </Card>
            </div>

            {/* Recent Incidents */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Recent Cheating Incidents
              </h3>
              <div className="space-y-3">
                {analytics.cheating.recentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="border-l-4 border-red-400 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {incident.user.name}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {incident.description}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(incident.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
                {analytics.cheating.recentIncidents.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No recent incidents
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity.type === "todo"
                          ? "bg-blue-500"
                          : activity.type === "quiz"
                          ? "bg-green-500"
                          : "bg-purple-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {activity.title.en || activity.title}
                      </p>
                      <p className="text-gray-600 text-xs">{activity.stats}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Create Todo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Assign tasks to students with due dates and priorities.
                </p>
                <Button className="w-full" onClick={handleCreateTodo}>
                  + New Todo
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Create Quiz</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Design interactive quizzes with automatic grading.
                </p>
                <Button className="w-full" onClick={handleCreateQuiz}>
                  + New Quiz
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Create Exam</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set up proctored exams with anti-cheating features.
                </p>
                <Button
                  className="w-full"
                  onClick={() => setIsExamFormOpen(true)}
                >
                  + New Exam
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Create Module</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Design comprehensive learning modules with lessons and
                  activities.
                </p>
                <Button className="w-full" onClick={handleCreateModule}>
                  + New Module
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Module Form Modal */}
        <ModuleForm
          module={editingModule}
          isOpen={isModuleFormOpen}
          onClose={() => {
            setIsModuleFormOpen(false);
            setEditingModule(null);
          }}
          onSave={handleSaveModule}
        />

        {/* Exam Form Modal */}
        <ExamForm
          exam={editingExam}
          modules={moduleAnalytics}
          isOpen={isExamFormOpen}
          onClose={() => {
            setIsExamFormOpen(false);
            setEditingExam(null);
          }}
          onSave={handleSaveExam}
        />
      </div>
    </div>
  );
};

export default TeacherDashboard;
