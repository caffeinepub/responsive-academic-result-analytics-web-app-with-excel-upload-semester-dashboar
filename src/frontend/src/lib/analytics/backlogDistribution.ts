import { StudentRecord } from '../state/appFlowTypes';

export interface BacklogGroup {
  backlogCount: number;
  studentCount: number;
  rollNumbers: string[];
}

/**
 * Compute backlog distribution grouping students by number of backlogs
 * @param students - Array of student records for a specific semester
 * @returns Array of backlog groups sorted by backlog count
 */
export function computeBacklogDistribution(students: StudentRecord[]): BacklogGroup[] {
  const distributionMap = new Map<number, Set<string>>();

  students.forEach(student => {
    const backlogCount = student.backlogSubjects.length;
    
    // Only include students with at least one backlog
    if (backlogCount > 0) {
      if (!distributionMap.has(backlogCount)) {
        distributionMap.set(backlogCount, new Set());
      }
      distributionMap.get(backlogCount)!.add(student.rollNumber);
    }
  });

  // Convert to array and sort by backlog count
  const groups: BacklogGroup[] = [];
  
  distributionMap.forEach((rollNumbersSet, backlogCount) => {
    const sortedRollNumbers = Array.from(rollNumbersSet).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    
    groups.push({
      backlogCount,
      studentCount: sortedRollNumbers.length,
      rollNumbers: sortedRollNumbers,
    });
  });

  // Sort by backlog count ascending
  groups.sort((a, b) => a.backlogCount - b.backlogCount);

  return groups;
}
