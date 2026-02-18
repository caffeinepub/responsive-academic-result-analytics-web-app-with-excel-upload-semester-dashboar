import { StudentRecord } from '../state/appFlowTypes';

export interface SubjectFailureInfo {
  subjectCode: string;
  failedStudents: string[];
}

/**
 * Compute per-subject failing roll numbers from student records
 * @param students - Array of student records for a specific semester
 * @returns Map of subject code to sorted array of failed student roll numbers
 */
export function computeSubjectFailures(students: StudentRecord[]): Map<string, string[]> {
  const subjectFailuresMap = new Map<string, Set<string>>();

  students.forEach(student => {
    student.backlogSubjects.forEach(subject => {
      if (!subjectFailuresMap.has(subject)) {
        subjectFailuresMap.set(subject, new Set());
      }
      subjectFailuresMap.get(subject)!.add(student.rollNumber);
    });
  });

  // Convert sets to sorted arrays
  const result = new Map<string, string[]>();
  subjectFailuresMap.forEach((rollNumbersSet, subject) => {
    const sortedRollNumbers = Array.from(rollNumbersSet).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    result.set(subject, sortedRollNumbers);
  });

  return result;
}
