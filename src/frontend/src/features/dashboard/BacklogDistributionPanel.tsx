import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { BacklogGroup } from '@/lib/analytics/backlogDistribution';
import { formatNumber } from '@/lib/format/numberFormat';

interface BacklogDistributionPanelProps {
  backlogGroups: BacklogGroup[];
  onRollNumberSelect?: (rollNumber: string) => void;
}

export default function BacklogDistributionPanel({ 
  backlogGroups,
  onRollNumberSelect 
}: BacklogDistributionPanelProps) {
  if (backlogGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backlog Distribution</CardTitle>
          <CardDescription>Students grouped by number of backlogs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No students with backlogs in this semester
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleRollNumberClick = (rollNumber: string) => {
    if (onRollNumberSelect) {
      onRollNumberSelect(rollNumber);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backlog Distribution</CardTitle>
        <CardDescription>Students grouped by number of backlogs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {backlogGroups.map((group) => (
          <Collapsible key={group.backlogCount}>
            <div className="border border-border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    {group.backlogCount} backlog{group.backlogCount !== 1 ? 's' : ''}
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatNumber(group.studentCount)} student{group.studentCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 py-3 bg-muted/30 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {group.rollNumbers.map((rollNo) => (
                      <Button
                        key={rollNo}
                        variant="secondary"
                        size="sm"
                        className="font-mono text-xs h-7 px-2.5 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
                        onClick={() => handleRollNumberClick(rollNo)}
                      >
                        {rollNo}
                      </Button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
