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
  const subjectCatalog: Record<string, string> = {};

  data.forEach((row, index) => {
    try {
      const htno = String(row[htnoCol] || '').trim();
      if (!htno) return; // Skip empty rows

      const semester = semesterCol ? String(row[semesterCol] || 'Semester 1').trim() : 'Semester 1';
      
      // Get subject code and name
      const subCode = subCodeCol ? String(row[subCodeCol] || '').trim() : '';
      const subName = subNameCol ? String(row[subNameCol] || '').trim() : '';
      
      // Use subject code as primary identifier, fallback to subject name
      const subjectIdentifier = subCode || subName;
      
      if (!subjectIdentifier) {
        console.warn(`Row ${index + 2}: Missing both subject code and name, skipping`);
        return;
      }

      // Build subject catalog mapping (code -> name)
      if (subCode && subName) {
        subjectCatalog[subCode] = subName;
      } else if (subCode && !subName) {
        // Code exists but no name - use empty string as fallback
        if (!subjectCatalog[subCode]) {
          subjectCatalog[subCode] = '';
        }
      }

      // Check if this is a department/branch column (not a subject)
      const isDepartmentRow = branchCol && row[branchCol];
      if (isDepartmentRow) {
        const dept = String(row[branchCol] || '').trim();
        if (dept) {
          departmentsSet.add(dept);
        }
      }

      subjectsSet.add(subjectIdentifier);

      const key = `${htno}_${semester}`;
      if (!studentMap.has(key)) {
        studentMap.set(key, new Map());
      }
      
      const semesterMap = studentMap.get(key)!;
      if (!semesterMap.has(htno)) {
        semesterMap.set(htno, []);
      }
      
      semesterMap.get(htno)!.push(row);
    } catch (err) {
      console.warn(`Error processing row ${index + 2}:`, err);
    }
  });

  // Convert to StudentRecord array
  const students: StudentRecord[] = [];

  studentMap.forEach((semesterMap, key) => {
    semesterMap.forEach((rows, htno) => {
      if (rows.length === 0) return;

      const firstRow = rows[0];
      const semester = semesterCol ? String(firstRow[semesterCol] || 'Semester 1').trim() : 'Semester 1';
      const studentName = nameCol ? String(firstRow[nameCol] || '').trim() : '';
      const department = branchCol ? String(firstRow[branchCol] || '').trim() : undefined;

      const subjectResults: Record<string, { marks?: number; status: 'pass' | 'fail' }> = {};
      const backlogSubjects: string[] = [];

      rows.forEach(row => {
        const subCode = subCodeCol ? String(row[subCodeCol] || '').trim() : '';
        const subName = subNameCol ? String(row[subNameCol] || '').trim() : '';
        const subjectIdentifier = subCode || subName;
        
        if (!subjectIdentifier) return;

        const gradeLetter = String(row[gradeLetterCol] || '').trim().toUpperCase();
        const gradePoint = gradePointCol ? parseFloat(row[gradePointCol]) : undefined;

        // Determine pass/fail
        const failGrades = ['F', 'AB', 'ABSENT', 'FAIL'];
        const status = failGrades.includes(gradeLetter) ? 'fail' : 'pass';

        subjectResults[subjectIdentifier] = {
          marks: gradePoint,
          status,
        };

        if (status === 'fail') {
          backlogSubjects.push(subjectIdentifier);
        }
      });

      const overallStatus = backlogSubjects.length === 0 ? 'pass' : 'fail';

      students.push({
        rollNumber: htno,
        studentName,
        semester,
        department,
        subjectResults,
        overallStatus,
        backlogSubjects,
      });
    });
  });

  return {
    students,
    semesters: Array.from(new Set(students.map(s => s.semester))).sort(),
    subjects: Array.from(subjectsSet).sort(),
    departments: Array.from(departmentsSet).sort(),
    subjectCatalog,
  };
}

function processWideFormatData(data: any[], columns: string[]): ParsedData {
  // Find roll number column
  const rollNumberCol = columns.find(c => 
    /roll.*no|roll.*number|htno|hall.*ticket|student.*id/i.test(c)
  );

  if (!rollNumberCol) {
    throw new Error('Could not find Roll Number column. Please ensure your Excel file has a column with "Roll No", "HTNO", or "Hall Ticket" in the header.');
  }

  // Find optional columns
  const nameCol = columns.find(c => /name|student.*name/i.test(c));
  const semesterCol = columns.find(c => /sem|semester/i.test(c));
  const branchCol = columns.find(c => /branch|department|dept/i.test(c));

  // Identify subject columns (exclude metadata columns)
  const metadataColumns = [rollNumberCol, nameCol, semesterCol, branchCol].filter(Boolean) as string[];
  const subjectColumns = columns.filter(col => !metadataColumns.includes(col));

  if (subjectColumns.length === 0) {
    throw new Error('No subject columns found. Please ensure your Excel file has subject columns with marks or grades.');
  }

  const students: StudentRecord[] = [];
  const subjectsSet = new Set<string>();
  const departmentsSet = new Set<string>();
  const subjectCatalog: Record<string, string> = {};

  data.forEach((row, index) => {
    try {
      const rollNumber = String(row[rollNumberCol] || '').trim();
      if (!rollNumber) return; // Skip empty rows

      const studentName = nameCol ? String(row[nameCol] || '').trim() : '';
      const semester = semesterCol ? String(row[semesterCol] || 'Semester 1').trim() : 'Semester 1';
      const department = branchCol ? String(row[branchCol] || '').trim() : undefined;

      if (department) {
        departmentsSet.add(department);
      }

      const subjectResults: Record<string, { marks?: number; status: 'pass' | 'fail' }> = {};
      const backlogSubjects: string[] = [];

      subjectColumns.forEach(subject => {
        subjectsSet.add(subject);
        
        // In wide format, subject column name is the identifier
        // No separate name available, so catalog maps to empty string
        if (!subjectCatalog[subject]) {
          subjectCatalog[subject] = '';
        }

        const value = String(row[subject] || '').trim().toUpperCase();
        
        if (!value) {
          // Empty cell - treat as not applicable
          return;
        }

        // Try to parse as number first
        const numericValue = parseFloat(value);
        
        let status: 'pass' | 'fail';
        let marks: number | undefined;

        if (!isNaN(numericValue)) {
          // Numeric marks
          marks = numericValue;
          // Assume passing marks is 40 (common threshold)
          status = numericValue >= 40 ? 'pass' : 'fail';
        } else {
          // Grade letter
          const failGrades = ['F', 'AB', 'ABSENT', 'FAIL'];
          status = failGrades.includes(value) ? 'fail' : 'pass';
        }

        subjectResults[subject] = { marks, status };

        if (status === 'fail') {
          backlogSubjects.push(subject);
        }
      });

      const overallStatus = backlogSubjects.length === 0 ? 'pass' : 'fail';

      students.push({
        rollNumber,
        studentName,
        semester,
        department,
        subjectResults,
        overallStatus,
        backlogSubjects,
      });
    } catch (err) {
      console.warn(`Error processing row ${index + 2}:`, err);
    }
  });

  return {
    students,
    semesters: Array.from(new Set(students.map(s => s.semester))).sort(),
    subjects: Array.from(subjectsSet).sort(),
    departments: Array.from(departmentsSet).sort(),
    subjectCatalog,
  };
}
