import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumber } from '@/lib/format/numberFormat';
import { AlertCircle } from 'lucide-react';

interface SubjectAnalysisListProps {
  subjectBacklogs: Record<string, number>;
  subjectFailures: Map<string, string[]>;
  subjectCatalog: Record<string, string>;
  onFailedStudentSelect?: (rollNumber: string) => void;
}

export default function SubjectAnalysisList({
  subjectBacklogs,
  subjectFailures,
  subjectCatalog,
  onFailedStudentSelect,
}: SubjectAnalysisListProps) {
  const subjectEntries = Object.entries(subjectBacklogs)
    .map(([code, count]) => ({
      code,
      name: subjectCatalog[code] || 'Name not available',
      count,
      failedStudents: subjectFailures.get(code) || [],
    }))
    .sort((a, b) => b.count - a.count);

  if (subjectEntries.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No backlogs recorded for this semester
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {subjectEntries.map((subject) => (
        <div key={subject.code} className="space-y-3 p-4 border border-border rounded-lg bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono font-semibold text-foreground">
                  {subject.code}
                </span>
                <span className="text-sm text-muted-foreground">
                  {subject.name}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                {formatNumber(subject.count)} students
              </Badge>
              
              <Select 
                disabled={subject.failedStudents.length === 0}
                onValueChange={(value) => {
                  if (onFailedStudentSelect && value !== 'none') {
                    onFailedStudentSelect(value);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue 
                    placeholder={
                      subject.failedStudents.length === 0 
                        ? "No failed students" 
                        : "View failed students"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {subject.failedStudents.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No failed students
                    </SelectItem>
                  ) : (
                    subject.failedStudents.map((rollNo) => (
                      <SelectItem key={rollNo} value={rollNo}>
                        {rollNo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {subject.failedStudents.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                {subject.failedStudents.length} student{subject.failedStudents.length !== 1 ? 's' : ''} failed this subject
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
