export interface StudentRecord {
  rollNumber: string;
  studentName: string;
  semester: string;
  department?: string;
  subjectResults: Record<string, { marks?: number; status: 'pass' | 'fail' }>;
  overallStatus: 'pass' | 'fail';
  backlogSubjects: string[];
}

export interface ParsedData {
  students: StudentRecord[];
  semesters: string[];
  subjects: string[];
  departments: string[];
}

export interface SemesterAnalytics {
  semester: string;
  totalStudents: number;
  passedCount: number;
  failedCount: number;
  passPercentage: number;
  failurePercentage: number;
  totalBacklogs: number;
  studentsWithBacklogs: number;
  subjectWiseBacklogs: Record<string, number>;
}
