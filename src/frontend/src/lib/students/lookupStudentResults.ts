import { StudentRecord } from '../state/appFlowTypes';

export interface StudentLookupResult {
  student: StudentRecord;
  matchedOn: 'rollNumber';
}

/**
 * Performs a case-insensitive and whitespace-tolerant lookup of student records by roll number.
 * Returns all matching records (to support multiple semesters).
 */
export function lookupStudentByRollNumber(
  students: StudentRecord[],
  rollNumber: string
): StudentLookupResult[] {
  if (!rollNumber || !students || students.length === 0) {
    return [];
  }

  // Normalize the search term: trim and convert to lowercase
  const normalizedSearch = rollNumber.trim().toLowerCase();

  if (!normalizedSearch) {
    return [];
  }

  // Find all matching students
  const matches = students.filter((student) => {
    const normalizedRollNumber = student.rollNumber.trim().toLowerCase();
    return normalizedRollNumber === normalizedSearch;
  });

  return matches.map((student) => ({
    student,
    matchedOn: 'rollNumber' as const,
  }));
}
