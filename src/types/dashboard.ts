// Student related types
export interface StudentData {
  id: string;
  name: string;
  email: string;
  grade: string;
  modulesCompleted: number;
  totalModules: number;
  timeSpent: number;
  averageScore: number;
  progress: number;
  lastActive: string;
  isActive: boolean;
}

export interface ClassStats {
  totalStudents: number;
  activeStudents: number;
  completedModules: number;
  averageProgress: number;
  totalTimeSpent: number;
  averageScore: number;
}

export interface StudentAnalyticsData {
  students: StudentData[];
  classStats: ClassStats;
}

// Module related types
export interface BilingualText {
  en: string;
  ne: string;
}

export interface Lesson {
  title: BilingualText;
  content: BilingualText;
  order: number;
}

export interface Todo {
  id: number;
  title: BilingualText;
  description: BilingualText;
  order: number;
}

export interface TodoProgress {
  id: string;
  userId: string;
  moduleId: string;
  todoId: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleAnalytics {
  totalStudents: number;
  completedCount: number;
  inProgressCount: number;
  averageScore: number;
  completionRate: number;
}

export interface Module {
  id: string;
  title: BilingualText;
  description: BilingualText;
  category:
    | "DIGITAL_LITERACY"
    | "CYBERSECURITY"
    | "DIGITAL_COMMUNICATION"
    | "DATA_PRIVACY"
    | "ONLINE_ETHICS";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  duration: number;
  isActive: boolean;
  isOffline: boolean;
  lessons: Lesson[];
  todos?: Todo[];
  createdAt: string;
  updatedAt: string;
  analytics?: ModuleAnalytics;
}

export interface ModuleFormData {
  id?: string;
  title: BilingualText;
  description: BilingualText;
  category: string;
  difficulty: string;
  duration: number;
  isOffline: boolean;
  lessons: Lesson[];
  todos?: Todo[];
}

// Progress related types
export interface ModuleProgress {
  id: string;
  userId: string;
  moduleId: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
  currentLesson: number;
  lastAccessed: string;
  isOffline: boolean;
  syncPending: boolean;
  createdAt: string;
  updatedAt: string;
}

// User related types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  grade?: string;
  school?: string;
  language: "ENGLISH" | "NEPALI";
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard types
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalModules: number;
  completedModules: number;
  averageProgress: number;
  averageScore: number;
}

export interface TeacherDashboardData {
  stats: DashboardStats;
  students: StudentData[];
  modules: Module[];
  recentActivity: any[];
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ProgressChartData {
  students: ChartDataPoint[];
  modules: ChartDataPoint[];
  timeframe: "week" | "month" | "all";
}

// Form types
export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: FormFieldError[];
}

// Notification types
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Filter and sort types
export interface StudentFilter {
  grade?: string;
  status?: "active" | "inactive" | "all";
  progress?: "high" | "medium" | "low" | "all";
  timeframe?: "week" | "month" | "all";
}

export interface ModuleFilter {
  category?: string;
  difficulty?: string;
  status?: "active" | "inactive" | "all";
}

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

// Export and report types
export interface ExportOptions {
  format: "csv" | "pdf" | "excel";
  timeframe: "week" | "month" | "all";
  includeCharts: boolean;
  includeDetails: boolean;
}

export interface ReportData {
  summary: ClassStats;
  students: StudentData[];
  modules: Module[];
  exportedAt: string;
  timeframe: string;
}

// Module Analytics types
export interface ModuleAnalyticsData {
  id: string;
  title: BilingualText;
  category: string;
  difficulty: string;
  duration: number;
  totalEnrollments: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionRate: number;
  totalTimeSpent: number;
  averageTimeSpent: number;
  averageScore: number;
  activeUsers: number;
  recentActivity: ModuleActivity[];
}

export interface ModuleActivity {
  userId: string;
  userName: string;
  userGrade: string;
  timeSpent: number;
  score: number | null;
  completed: boolean;
  lastAccessed: string;
}

export interface ModuleOverallStats {
  totalModules: number;
  totalEnrollments: number;
  totalCompletions: number;
  averageCompletionRate: number;
  totalTimeSpent: number;
  averageModuleScore: number;
}

export interface ModuleAnalyticsResponse {
  modules: ModuleAnalyticsData[];
  overallStats: ModuleOverallStats;
}
