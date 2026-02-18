import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParsedData, SemesterAnalytics } from '@/lib/state/appFlowTypes';
import { formatNumber, formatPercentage } from '@/lib/format/numberFormat';
import SimpleBarChart from '@/components/charts/SimpleBarChart';
import SimplePieChart from '@/components/charts/SimplePieChart';
import StudentResultLookupCard from './StudentResultLookupCard';
import SubjectAnalysisList from './SubjectAnalysisList';
import BacklogDistributionPanel from './BacklogDistributionPanel';
import StudentDataSheetPanel from './StudentDataSheetPanel';
import { computeSubjectFailures } from '@/lib/analytics/subjectFailure';
import { computeBacklogDistribution } from '@/lib/analytics/backlogDistribution';
import { TrendingUp, TrendingDown, Users, BookOpen, AlertTriangle, BarChart3, Building2 } from 'lucide-react';

interface SemesterDashboardViewProps {
  parsedData: ParsedData;
  allParsedData: ParsedData;
  analytics: Map<string, SemesterAnalytics>;
  selectedSemester: string | null;
  onSemesterChange: (semester: string) => void;
  onViewComparison: () => void;
  availableDepartments: string[];
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
}

const ALL_DEPARTMENTS = 'all';

export default function SemesterDashboardView({
  parsedData,
  allParsedData,
  analytics,
  selectedSemester,
  onSemesterChange,
  onViewComparison,
  availableDepartments,
  selectedDepartment,
  onDepartmentChange,
}: SemesterDashboardViewProps) {
  const [selectedRollNumber, setSelectedRollNumber] = useState<string | null>(null);
  
  const semesters = Array.from(analytics.keys()).sort();
  const hasMultipleSemesters = semesters.length > 1;
  const hasDepartments = availableDepartments.length > 0;

  // Get students for selected semester
  const selectedSemesterStudents = useMemo(() => {
    if (!selectedSemester) return [];
    return parsedData.students.filter(s => s.semester === selectedSemester);
  }, [parsedData.students, selectedSemester]);

  // Compute subject failures for selected semester
  const subjectFailures = useMemo(() => {
    return computeSubjectFailures(selectedSemesterStudents);
  }, [selectedSemesterStudents]);

  // Compute backlog distribution for selected semester
  const backlogGroups = useMemo(() => {
    return computeBacklogDistribution(selectedSemesterStudents);
  }, [selectedSemesterStudents]);

  // Find selected student
  const selectedStudent = useMemo(() => {
    if (!selectedRollNumber) return null;
    return selectedSemesterStudents.find(
      s => s.rollNumber.toLowerCase().trim() === selectedRollNumber.toLowerCase().trim()
    ) || null;
  }, [selectedRollNumber, selectedSemesterStudents]);

  // Handle student selection from dropdown or backlog distribution
  const handleFailedStudentSelect = (rollNumber: string) => {
    setSelectedRollNumber(rollNumber);
  };

  // Handle closing the student data sheet
  const handleCloseDataSheet = () => {
    setSelectedRollNumber(null);
  };

  // Handle empty state after filtering
  if (!selectedSemester || semesters.length === 0) {
    return (
      <div className="space-y-6">
        {hasDepartments && (
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS}>All departments</SelectItem>
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No students found for the selected department. Please select a different department or upload a new file.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const semesterData = analytics.get(selectedSemester);

  if (!semesterData) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No data available for this semester.</p>
        </CardContent>
      </Card>
    );
  }

  const passFailData = [
    { name: 'Passed', value: semesterData.passedCount, color: 'oklch(var(--chart-2))' },
    { name: 'Failed', value: semesterData.failedCount, color: 'oklch(var(--chart-1))' },
  ];

  const subjectBacklogData = Object.entries(semesterData.subjectWiseBacklogs)
    .map(([subject, count]) => ({
      name: subject,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            Semester: {selectedSemester}
            {selectedDepartment !== ALL_DEPARTMENTS && ` • ${selectedDepartment}`}
          </p>
        </div>
        {hasMultipleSemesters && (
          <Button onClick={onViewComparison} variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Compare Semesters
          </Button>
        )}
      </div>

      {hasDepartments && (
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DEPARTMENTS}>All departments</SelectItem>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Student Result Lookup Section */}
      <StudentResultLookupCard
        filteredStudents={parsedData.students}
        allStudents={allParsedData.students}
        selectedDepartment={selectedDepartment}
      />

      {hasMultipleSemesters && (
        <div className="flex flex-wrap gap-2">
          {semesters.map((sem) => (
            <Button
              key={sem}
              variant={sem === selectedSemester ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSemesterChange(sem)}
            >
              {sem}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          <TabsTrigger value="graphs">Visualizations</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(semesterData.totalStudents)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enrolled in {selectedSemester}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-2">
                  {formatPercentage(semesterData.passPercentage)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(semesterData.passedCount)} students passed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-1">
                  {formatPercentage(semesterData.failurePercentage)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(semesterData.failedCount)} students failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backlogs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(semesterData.totalBacklogs)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(semesterData.studentsWithBacklogs)} students affected
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Key metrics for {selectedSemester}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Students Passed</span>
                    <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                      {formatNumber(semesterData.passedCount)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Students Failed</span>
                    <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                      {formatNumber(semesterData.failedCount)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Students with Backlogs</span>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      {formatNumber(semesterData.studentsWithBacklogs)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Backlog Count</span>
                    <Badge variant="outline">
                      {formatNumber(semesterData.totalBacklogs)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          {/* Student Data Sheet Panel */}
          {selectedRollNumber && (
            <StudentDataSheetPanel
              student={selectedStudent}
              subjectCatalog={parsedData.subjectCatalog}
              onClose={handleCloseDataSheet}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Backlog Analysis</CardTitle>
              <CardDescription>
                Number of students with backlogs in each subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectAnalysisList
                subjectBacklogs={semesterData.subjectWiseBacklogs}
                subjectFailures={subjectFailures}
                subjectCatalog={parsedData.subjectCatalog}
                onFailedStudentSelect={handleFailedStudentSelect}
              />
            </CardContent>
          </Card>

          <BacklogDistributionPanel 
            backlogGroups={backlogGroups}
            onRollNumberSelect={handleFailedStudentSelect}
          />
        </TabsContent>

        <TabsContent value="graphs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pass/Fail Distribution</CardTitle>
                <CardDescription>Overall student performance</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SimplePieChart data={passFailData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Backlogs</CardTitle>
                <CardDescription>Top subjects with most backlogs</CardDescription>
              </CardHeader>
              <CardContent>
                {subjectBacklogData.length > 0 ? (
                  <SimpleBarChart data={subjectBacklogData.slice(0, 10)} />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No backlog data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
