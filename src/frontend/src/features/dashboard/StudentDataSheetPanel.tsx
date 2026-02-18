import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, CheckCircle2, XCircle, AlertCircle, User } from 'lucide-react';
import { StudentRecord } from '@/lib/state/appFlowTypes';

interface StudentDataSheetPanelProps {
  student: StudentRecord | null;
  subjectCatalog: Record<string, string>;
  onClose: () => void;
}

export default function StudentDataSheetPanel({
  student,
  subjectCatalog,
  onClose,
}: StudentDataSheetPanelProps) {
  if (!student) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Student Not Found
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Student record not found. The student may not be in the currently selected semester or department filter.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const subjectEntries = Object.entries(student.subjectResults).map(([code, result]) => ({
    code,
    name: subjectCatalog[code] || 'Name not available',
    status: result.status,
    marks: result.marks,
  }));

  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Student Data Sheet</CardTitle>
              <CardDescription>Complete academic record</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Student Name</p>
            <p className="font-medium">
              {student.studentName || 'Name not available'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Roll Number</p>
            <p className="font-mono font-medium">{student.rollNumber}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Semester</p>
            <p className="font-medium">{student.semester}</p>
          </div>
          {student.department && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{student.department}</p>
            </div>
          )}
        </div>

        {/* Overall Status */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Overall Status</p>
            <div className="flex items-center gap-2">
              {student.overallStatus === 'pass' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                  <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                    Passed
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-chart-1" />
                  <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                    Failed
                  </Badge>
                </>
              )}
            </div>
          </div>
          {student.backlogSubjects.length > 0 && (
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Backlogs</p>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {student.backlogSubjects.length} subject{student.backlogSubjects.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Backlog Subjects */}
        {student.backlogSubjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Backlog Subjects</p>
            <div className="flex flex-wrap gap-2">
              {student.backlogSubjects.map((subjectCode) => (
                <Badge key={subjectCode} variant="outline" className="font-mono">
                  {subjectCode}
                  {subjectCatalog[subjectCode] && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      • {subjectCatalog[subjectCode]}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Subject-wise Results Table */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Subject-wise Results</p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No subject results available
                    </TableCell>
                  </TableRow>
                ) : (
                  subjectEntries.map((subject) => (
                    <TableRow key={subject.code}>
                      <TableCell className="font-mono font-medium">
                        {subject.code}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subject.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.status === 'pass' ? (
                          <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                            Pass
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                            Fail
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {subject.marks !== undefined ? subject.marks : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
