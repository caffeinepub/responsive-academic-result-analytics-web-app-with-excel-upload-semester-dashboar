import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SemesterAnalytics } from '@/lib/state/appFlowTypes';
import { formatNumber, formatPercentage } from '@/lib/format/numberFormat';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SemesterComparisonViewProps {
  analytics: Map<string, SemesterAnalytics>;
  onBack: () => void;
}

export default function SemesterComparisonView({ analytics, onBack }: SemesterComparisonViewProps) {
  const semesters = Array.from(analytics.keys()).sort();
  
  if (semesters.length < 2) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Multiple semesters required for comparison
          </p>
          <div className="flex justify-center mt-4">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const passRateData = semesters.map((sem) => {
    const data = analytics.get(sem);
    return {
      name: sem,
      value: data?.passPercentage ?? 0,
    };
  });

  const failureRateData = semesters.map((sem) => {
    const data = analytics.get(sem);
    return {
      name: sem,
      value: data?.failurePercentage ?? 0,
    };
  });

  const calculateChange = (current: number, previous: number): { value: number; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { value: 0, trend: 'neutral' };
    const change = current - previous;
    return {
      value: change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral', isPositive: boolean) => {
    if (trend === 'neutral') return <Minus className="h-4 w-4" />;
    const Icon = trend === 'up' ? TrendingUp : TrendingDown;
    const colorClass = (trend === 'up' && isPositive) || (trend === 'down' && !isPositive)
      ? 'text-chart-2'
      : 'text-chart-1';
    return <Icon className={`h-4 w-4 ${colorClass}`} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Semester Comparison</h2>
          <p className="text-muted-foreground">Analyze trends across semesters</p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pass Rate Trend</CardTitle>
            <CardDescription>Percentage of students passing over semesters</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={passRateData} color="oklch(var(--chart-2))" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failure Rate Trend</CardTitle>
            <CardDescription>Percentage of students failing over semesters</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={failureRateData} color="oklch(var(--chart-1))" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
          <CardDescription>Semester-by-semester performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-right">Total Students</TableHead>
                  <TableHead className="text-right">Pass Rate</TableHead>
                  <TableHead className="text-right">Failure Rate</TableHead>
                  <TableHead className="text-right">Total Backlogs</TableHead>
                  <TableHead className="text-right">Students w/ Backlogs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((sem) => {
                  const data = analytics.get(sem);
                  if (!data) return null;

                  return (
                    <TableRow key={sem}>
                      <TableCell className="font-medium">{sem}</TableCell>
                      <TableCell className="text-right">{formatNumber(data.totalStudents)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                          {formatPercentage(data.passPercentage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                          {formatPercentage(data.failurePercentage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(data.totalBacklogs)}</TableCell>
                      <TableCell className="text-right">{formatNumber(data.studentsWithBacklogs)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semester-to-Semester Changes</CardTitle>
          <CardDescription>Performance improvements and declines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {semesters.slice(1).map((sem, idx) => {
              const current = analytics.get(sem);
              const previous = analytics.get(semesters[idx]);
              
              if (!current || !previous) return null;

              const passChange = calculateChange(current.passPercentage, previous.passPercentage);
              const failChange = calculateChange(current.failurePercentage, previous.failurePercentage);

              return (
                <div key={sem} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">
                    {semesters[idx]} → {sem}
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm font-medium">Pass Rate Change</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(passChange.trend, true)}
                        <span className={`text-sm font-semibold ${
                          passChange.trend === 'up' ? 'text-chart-2' :
                          passChange.trend === 'down' ? 'text-chart-1' :
                          'text-muted-foreground'
                        }`}>
                          {passChange.value > 0 ? '+' : ''}{formatPercentage(passChange.value)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <span className="text-sm font-medium">Failure Rate Change</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(failChange.trend, false)}
                        <span className={`text-sm font-semibold ${
                          failChange.trend === 'down' ? 'text-chart-2' :
                          failChange.trend === 'up' ? 'text-chart-1' :
                          'text-muted-foreground'
                        }`}>
                          {failChange.value > 0 ? '+' : ''}{formatPercentage(failChange.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
