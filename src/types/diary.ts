export type UserRole = "student" | "teacher";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  classId?: string;
}

export interface Addition {
  id: string;
  content: string;
  questionContext: string;
  createdAt: string;
}

export interface TeacherComment {
  id: string;
  teacherId: string;
  teacherName: string;
  content: string;
  createdAt: string;
}

export interface AIFeedback {
  feedback: string;
  question: string;
  generatedAt: string;
}

export interface DiaryImage {
  id: string;
  data: string; // Base64 encoded
  name: string;
  type: string;
  createdAt: string;
}

export interface Diary {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  images: DiaryImage[];
  createdAt: string;
  updatedAt: string;
  aiFeedback?: AIFeedback;
  additions: Addition[];
  teacherComments: TeacherComment[];
  syncStatus: "pending" | "synced" | "error";
}

export interface AppSettings {
  geminiApiKey?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  appsScriptUrl?: string;
}

export type SortOrder = "newest" | "oldest";
export type ViewMode = "grid" | "list" | "calendar";

export interface DiaryFilters {
  search: string;
  sortOrder: SortOrder;
  viewMode: ViewMode;
}
