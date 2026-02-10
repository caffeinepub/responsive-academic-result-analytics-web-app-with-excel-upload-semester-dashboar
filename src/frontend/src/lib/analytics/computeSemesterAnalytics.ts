import { ParsedData, SemesterAnalytics } from '../state/appFlowTypes';

export function computeSemesterAnalytics(data: ParsedData): Map<string, SemesterAnalytics> {
  const analyticsMap = new Map<string, SemesterAnalytics>();

  data.semesters.forEach(semester => {
    const semesterStudents = data.students.filter(s => s.semester === semester);
    
    const totalStudents = semesterStudents.length;
    const passedCount = semesterStudents.filter(s => s.overallStatus === 'pass').length;
    const failedCount = totalStudents - passedCount;
    
    const passPercentage = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;
    const failurePercentage = totalStudents > 0 ? (failedCount / totalStudents) * 100 : 0;

    const studentsWithBacklogs = semesterStudents.filter(s => s.backlogSubjects.length > 0).length;
    const totalBacklogs = semesterStudents.reduce((sum, s) => sum + s.backlogSubjects.length, 0);

    // Subject-wise backlog count
    const subjectWiseBacklogs: Record<string, number> = {};
    semesterStudents.forEach(student => {
      student.backlogSubjects.forEach(subject => {
        subjectWiseBacklogs[subject] = (subjectWiseBacklogs[subject] || 0) + 1;
      });
    });

    analyticsMap.set(semester, {
      semester,
      totalStudents,
      passedCount,
      failedCount,
      passPercentage,
      failurePercentage,
      totalBacklogs,
      studentsWithBacklogs,
      subjectWiseBacklogs,
    });
  });

  return analyticsMap;
}
