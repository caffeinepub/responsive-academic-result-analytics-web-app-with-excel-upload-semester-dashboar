import { useState, useMemo, useEffect } from 'react';
import UploadScreen from './features/upload/UploadScreen';
import SemesterDashboardView from './features/dashboard/SemesterDashboardView';
import SemesterComparisonView from './features/comparison/SemesterComparisonView';
import { ParsedData, SemesterAnalytics } from './lib/state/appFlowTypes';
import { computeSemesterAnalytics } from './lib/analytics/computeSemesterAnalytics';
import { Button } from './components/ui/button';
import { ArrowLeft } from 'lucide-react';

type AppView = 'upload' | 'dashboard' | 'comparison';

const ALL_DEPARTMENTS = 'all';

function App() {
  const [view, setView] = useState<AppView>('upload');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(ALL_DEPARTMENTS);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  // Filter data by department
  const filteredData = useMemo<ParsedData | null>(() => {
    if (!parsedData) return null;
    
    if (selectedDepartment === ALL_DEPARTMENTS) {
      return parsedData;
    }

    const filteredStudents = parsedData.students.filter(
      student => student.department === selectedDepartment
    );

    // Recompute semesters and subjects from filtered students
    const semestersSet = new Set<string>();
    const subjectsSet = new Set<string>();

    filteredStudents.forEach(student => {
      semestersSet.add(student.semester);
      Object.keys(student.subjectResults).forEach(subject => {
        subjectsSet.add(subject);
      });
    });

    return {
      students: filteredStudents,
      semesters: Array.from(semestersSet).sort(),
      subjects: Array.from(subjectsSet).sort(),
      departments: parsedData.departments,
    };
  }, [parsedData, selectedDepartment]);

  // Compute analytics from filtered data
  const analytics = useMemo<Map<string, SemesterAnalytics>>(() => {
    if (!filteredData) return new Map();
    return computeSemesterAnalytics(filteredData);
  }, [filteredData]);

  // Auto-adjust semester selection when department changes
  useEffect(() => {
    if (!filteredData || !selectedSemester) return;

    const availableSemesters = Array.from(analytics.keys());
    
    // If current semester is not available after filtering, select first available
    if (!availableSemesters.includes(selectedSemester)) {
      if (availableSemesters.length > 0) {
        setSelectedSemester(availableSemesters[0]);
      } else {
        setSelectedSemester(null);
      }
    }
  }, [filteredData, analytics, selectedSemester]);

  const handleDataParsed = (data: ParsedData) => {
    setParsedData(data);
    setSelectedDepartment(ALL_DEPARTMENTS);
    
    const computedAnalytics = computeSemesterAnalytics(data);
    
    // Select first semester by default
    const firstSemester = Array.from(computedAnalytics.keys())[0];
    if (firstSemester) {
      setSelectedSemester(firstSemester);
      setView('dashboard');
    }
  };

  const handleReset = () => {
    setView('upload');
    setParsedData(null);
    setSelectedDepartment(ALL_DEPARTMENTS);
    setSelectedSemester(null);
  };

  const handleViewComparison = () => {
    setView('comparison');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Academic Result Analytics</h1>
              <p className="text-sm text-muted-foreground">Analyze student performance with ease</p>
            </div>
            {view !== 'upload' && (
              <Button onClick={handleReset} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Upload New File
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {view === 'upload' && <UploadScreen onDataParsed={handleDataParsed} />}
        
        {view === 'dashboard' && parsedData && filteredData && (
          <SemesterDashboardView
            parsedData={filteredData}
            allParsedData={parsedData}
            analytics={analytics}
            selectedSemester={selectedSemester}
            onSemesterChange={setSelectedSemester}
            onViewComparison={handleViewComparison}
            availableDepartments={parsedData.departments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={handleDepartmentChange}
          />
        )}
        
        {view === 'comparison' && filteredData && (
          <SemesterComparisonView
            analytics={analytics}
            onBack={handleBackToDashboard}
          />
        )}
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{' '}
            <a 
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
