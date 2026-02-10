import { ParsedData, StudentRecord } from '../state/appFlowTypes';
import { assertDefined } from '../guards/assertions';

// Use the global XLSX object loaded from CDN
declare const XLSX: any;

export async function parseExcelFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') {
      reject(new Error('Excel library not loaded. Please refresh the page.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        assertDefined(data, 'File data is empty');

        const workbook = XLSX.read(data, { type: 'binary' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('Excel file contains no sheets');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty or has no data rows');
        }

        const parsedData = processExcelData(jsonData);
        resolve(parsedData);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse Excel file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

function processExcelData(data: any[]): ParsedData {
  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  // Detect if this is long-format (row-wise) data
  const isLongFormat = detectLongFormat(columns);

  if (isLongFormat) {
    return processLongFormatData(data, columns);
  } else {
    return processWideFormatData(data, columns);
  }
}

function detectLongFormat(columns: string[]): boolean {
  // Long format has HTNO + (SUBCODE or SUBNAME) + GRADE_LETTER
  const hasHTNO = columns.some(c => /htno|hall.*ticket/i.test(c));
  const hasSubCode = columns.some(c => /subcode|sub.*code|subject.*code/i.test(c));
  const hasSubName = columns.some(c => /subname|sub.*name|subject.*name/i.test(c));
  const hasGradeLetter = columns.some(c => /grade.*letter|grade|letter/i.test(c));

  return hasHTNO && (hasSubCode || hasSubName) && hasGradeLetter;
}

function processLongFormatData(data: any[], columns: string[]): ParsedData {
  // Find key columns
  const htnoCol = columns.find(c => /htno|hall.*ticket/i.test(c));
  const nameCol = columns.find(c => /name|student.*name/i.test(c));
  const branchCol = columns.find(c => /branch|department|dept/i.test(c));
  const semesterCol = columns.find(c => /sem|semester/i.test(c));
  const subCodeCol = columns.find(c => /subcode|sub.*code|subject.*code/i.test(c));
  const subNameCol = columns.find(c => /subname|sub.*name|subject.*name/i.test(c));
  const gradeLetterCol = columns.find(c => /grade.*letter|grade|letter/i.test(c));
  const gradePointCol = columns.find(c => /grade.*point|point/i.test(c));
  const creditsCol = columns.find(c => /credits|credit/i.test(c));

  if (!htnoCol) {
    throw new Error('Could not find HTNO (Hall Ticket Number) column. Please ensure your Excel file has a column with "HTNO" or "Hall Ticket" in the header.');
  }

  if (!gradeLetterCol) {
    throw new Error('Could not find GRADE_LETTER column. Please ensure your Excel file has a column with "Grade" or "Grade Letter" in the header.');
  }

  // Group rows by student and semester
  const studentMap = new Map<string, Map<string, any[]>>();
  const subjectsSet = new Set<string>();
  const departmentsSet = new Set<string>();

  data.forEach((row, index) => {
    try {
      const htno = String(row[htnoCol] || '').trim();
      if (!htno) return; // Skip empty rows

      const semester = semesterCol ? String(row[semesterCol] || 'Semester 1').trim() : 'Semester 1';
      
      // Get department if available
      const department = branchCol ? String(row[branchCol] || '').trim() : '';
      if (department) {
        departmentsSet.add(department);
      }
      
      // Get subject identifier (prefer SUBCODE, fallback to SUBNAME)
      let subjectId = '';
      if (subCodeCol) {
        subjectId = String(row[subCodeCol] || '').trim();
      }
      if (!subjectId && subNameCol) {
        subjectId = String(row[subNameCol] || '').trim();
      }
      
      if (!subjectId) return; // Skip rows without subject identifier

      subjectsSet.add(subjectId);

      // Group by student
      if (!studentMap.has(htno)) {
        studentMap.set(htno, new Map());
      }
      const studentSemesters = studentMap.get(htno)!;
      
      if (!studentSemesters.has(semester)) {
        studentSemesters.set(semester, []);
      }
      studentSemesters.get(semester)!.push(row);
    } catch (error) {
      console.warn(`Skipping row ${index + 1} due to error:`, error);
    }
  });

  // Convert grouped data to StudentRecord[]
  const students: StudentRecord[] = [];
  const semesters = new Set<string>();

  studentMap.forEach((semesterMap, htno) => {
    semesterMap.forEach((rows, semester) => {
      semesters.add(semester);

      // Get student name from first row (optional)
      const studentName = nameCol ? String(rows[0][nameCol] || '').trim() : '';
      
      // Get department from first row (optional)
      const department = branchCol ? String(rows[0][branchCol] || '').trim() : undefined;

      const subjectResults: Record<string, { marks?: number; status: 'pass' | 'fail' }> = {};
      const backlogSubjects: string[] = [];
      let hasFailed = false;

      rows.forEach(row => {
        // Get subject identifier
        let subjectId = '';
        if (subCodeCol) {
          subjectId = String(row[subCodeCol] || '').trim();
        }
        if (!subjectId && subNameCol) {
          subjectId = String(row[subNameCol] || '').trim();
        }
        if (!subjectId) return;

        // Get grade letter
        const gradeLetter = String(row[gradeLetterCol] || '').trim().toUpperCase();
        
        // Determine status: F = fail, anything else non-empty = pass
        let status: 'pass' | 'fail' = 'pass';
        if (gradeLetter === 'F') {
          status = 'fail';
          hasFailed = true;
          backlogSubjects.push(subjectId);
        } else if (!gradeLetter) {
          // Empty grade letter - skip this subject
          return;
        }

        // Try to extract marks from grade point if available
        let marks: number | undefined = undefined;
        if (gradePointCol) {
          const gradePoint = parseFloat(String(row[gradePointCol] || '').trim());
          if (!isNaN(gradePoint)) {
            marks = gradePoint;
          }
        }

        subjectResults[subjectId] = { status, ...(marks !== undefined && { marks }) };
      });

      students.push({
        rollNumber: htno,
        studentName,
        semester,
        ...(department && { department }),
        subjectResults,
        overallStatus: hasFailed ? 'fail' : 'pass',
        backlogSubjects,
      });
    });
  });

  if (students.length === 0) {
    throw new Error('No valid student records found in the Excel file. Please check the file format.');
  }

  return {
    students,
    semesters: Array.from(semesters).sort(),
    subjects: Array.from(subjectsSet).sort(),
    departments: Array.from(departmentsSet).sort(),
  };
}

function processWideFormatData(data: any[], columns: string[]): ParsedData {
  const students: StudentRecord[] = [];
  const semesters = new Set<string>();
  const subjects = new Set<string>();
  const departmentsSet = new Set<string>();

  // Find key columns (case-insensitive) - now including HTNO and department
  const rollCol = columns.find(c => 
    /htno|hall.*ticket|roll|id|student.*id|enrollment/i.test(c)
  );
  const nameCol = columns.find(c => 
    /name|student.*name/i.test(c)
  );
  const semesterCol = columns.find(c => 
    /sem|semester/i.test(c)
  );
  const branchCol = columns.find(c => 
    /branch|department|dept/i.test(c)
  );

  if (!rollCol) {
    throw new Error('Could not find Roll Number, Student ID, or HTNO column. Please ensure your Excel file has a column with "Roll", "ID", "Student ID", or "HTNO" in the header.');
  }

  // Identify subject columns (exclude metadata columns)
  const metadataColumns = new Set([
    rollCol?.toLowerCase(),
    nameCol?.toLowerCase(),
    semesterCol?.toLowerCase(),
    branchCol?.toLowerCase(),
    'backlog',
    'backlogs',
    'status',
    'result',
    'total',
    'percentage',
    'grade',
    'branch',
    'department',
    'dept',
    'htno',
  ].filter(Boolean));

  const subjectColumns = columns.filter(col => {
    const lower = col.toLowerCase();
    return !metadataColumns.has(lower) && col.trim().length > 0;
  });

  // Process each row
  data.forEach((row, index) => {
    try {
      const rollNumber = String(row[rollCol] || '').trim();
      if (!rollNumber) return; // Skip empty rows

      // Student name is optional - use empty string if not present
      const studentName = nameCol ? String(row[nameCol] || '').trim() : '';
      const semester = semesterCol ? String(row[semesterCol] || 'Semester 1').trim() : 'Semester 1';
      
      // Get department if available
      const department = branchCol ? String(row[branchCol] || '').trim() : undefined;
      if (department) {
        departmentsSet.add(department);
      }

      semesters.add(semester);

      const subjectResults: Record<string, { marks?: number; status: 'pass' | 'fail' }> = {};
      const backlogSubjects: string[] = [];
      let hasFailed = false;

      // Process subject columns
      subjectColumns.forEach(subjectCol => {
        const value = String(row[subjectCol] || '').trim();
        if (!value) return;

        subjects.add(subjectCol);

        // Try to parse as number (marks)
        const marks = parseFloat(value);
        let status: 'pass' | 'fail' = 'pass';

        if (!isNaN(marks)) {
          // Assume passing marks is 40 or above (common threshold)
          status = marks >= 40 ? 'pass' : 'fail';
          subjectResults[subjectCol] = { marks, status };
        } else {
          // Parse as text status
          const lower = value.toLowerCase();
          if (lower.includes('fail') || lower === 'f' || lower === 'absent' || lower === 'ab') {
            status = 'fail';
          } else if (lower.includes('pass') || lower === 'p') {
            status = 'pass';
          }
          subjectResults[subjectCol] = { status };
        }

        if (status === 'fail') {
          hasFailed = true;
          backlogSubjects.push(subjectCol);
        }
      });

      students.push({
        rollNumber,
        studentName,
        semester,
        ...(department && { department }),
        subjectResults,
        overallStatus: hasFailed ? 'fail' : 'pass',
        backlogSubjects,
      });
    } catch (error) {
      console.warn(`Skipping row ${index + 1} due to error:`, error);
    }
  });

  if (students.length === 0) {
    throw new Error('No valid student records found in the Excel file. Please check the file format.');
  }

  return {
    students,
    semesters: Array.from(semesters).sort(),
    subjects: Array.from(subjects).sort(),
    departments: Array.from(departmentsSet).sort(),
  };
}
