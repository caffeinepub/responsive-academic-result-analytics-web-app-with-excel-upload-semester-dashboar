import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseExcelFile } from '@/lib/excel/parseExcelFile';
import { ParsedData } from '@/lib/state/appFlowTypes';

interface UploadScreenProps {
  onDataParsed: (data: ParsedData) => void;
}

export default function UploadScreen({ onDataParsed }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const data = await parseExcelFile(file);
      onDataParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, [onDataParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Student Results</CardTitle>
          <CardDescription>
            Upload an Excel file (.xls or .xlsx) containing student results data. The file should include roll numbers or HTNO, semesters, subjects, and grades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-4">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Processing your file...</p>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-accent p-4">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-1">
                      Drag and drop your Excel file here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click the button below to browse
                    </p>
                  </div>
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: .xls, .xlsx
                  </p>
                </>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-sm">Expected File Structure:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Roll Number / Student ID / HTNO column (required)</li>
              <li>Student Name column (optional)</li>
              <li>Semester information (optional, defaults to "Semester 1")</li>
              <li>Subject columns with marks or pass/fail status, OR</li>
              <li>Long format: SUBCODE/SUBNAME + GRADE_LETTER columns (F = fail/backlog)</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              The app automatically detects whether your file is in wide format (subjects as columns) or long format (one row per subject per student).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
