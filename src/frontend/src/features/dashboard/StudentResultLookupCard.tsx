import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, X, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { StudentRecord } from '@/lib/state/appFlowTypes';
import { lookupStudentByRollNumber, StudentLookupResult } from '@/lib/students/lookupStudentResults';

interface StudentResultLookupCardProps {
  filteredStudents: StudentRecord[];
  allStudents: StudentRecord[];
  selectedDepartment: string;
}

export default function StudentResultLookupCard({
  filteredStudents,
  allStudents,
  selectedDepartment,
}: StudentResultLookupCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<StudentLookupResult[]>([]);
  const [showNotFoundInDept, setShowNotFoundInDept] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setResults([]);
      setShowNotFoundInDept(false);
      return;
    }

    // Search in filtered students first
    const matches = lookupStudentByRollNumber(filteredStudents, searchTerm);

    if (matches.length > 0) {
      setResults(matches);
      setShowNotFoundInDept(false);
    } else {
      // If no matches in filtered data and a specific department is selected,
      // check if the student exists in the full dataset
      if (selectedDepartment !== 'all') {
        const allMatches = lookupStudentByRollNumber(allStudents, searchTerm);
        if (allMatches.length > 0) {
          setShowNotFoundInDept(true);
          setResults([]);
        } else {
          setShowNotFoundInDept(false);
          setResults([]);
        }
      } else {
        setShowNotFoundInDept(false);
        setResults([]);
      }
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setShowNotFoundInDept(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Result Lookup</CardTitle>
        <CardDescription>Search for a student by Hallticket No / Roll No</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter Hallticket No / Roll No"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button onClick={handleSearch} size="default">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {(searchTerm || results.length > 0 || showNotFoundInDept) && (
            <Button onClick={handleClear} variant="outline" size="default">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* No results message */}
        {searchTerm && results.length === 0 && !showNotFoundInDept && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No results found for hallticket number "{searchTerm}".
            </AlertDescription>
          </Alert>
        )}

        {/* Department-specific message */}
        {showNotFoundInDept && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Student with hallticket number "{searchTerm}" was not found in the selected department.
              Try switching to "All departments" to see results from other departments.
            </AlertDescription>
          </Alert>
        )}

        {/* Results display */}
        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {result.student.studentName || 'Name not available'}
                      </h3>
                      {result.student.overallStatus === 'pass' ? (
                        <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Passed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Roll No: <span className="font-medium text-foreground">{result.student.rollNumber}</span></span>
                      <span>Semester: <span className="font-medium text-foreground">{result.student.semester}</span></span>
                      {result.student.department && (
                        <span>Department: <span className="font-medium text-foreground">{result.student.department}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Backlog subjects */}
                {result.student.backlogSubjects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Backlog Subjects ({result.student.backlogSubjects.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.student.backlogSubjects.map((subject, idx) => (
                        <Badge key={idx} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject-wise results table */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Subject-wise Results</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(result.student.subjectResults).map(([subject, subjectResult]) => (
                          <TableRow key={subject}>
                            <TableCell className="font-medium">{subject}</TableCell>
                            <TableCell className="text-center">
                              {subjectResult.status === 'pass' ? (
                                <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                                  Pass
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                                  Fail
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {subjectResult.marks !== undefined ? subjectResult.marks : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
