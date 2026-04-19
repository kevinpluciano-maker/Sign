import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, AlertCircle, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, getAuthToken } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';

interface ImportStats {
  imported: number;
  updated: number;
  errors: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  stats: Record<string, ImportStats>;
  summary: {
    total_imported: number;
    total_updated: number;
    total_errors: number;
  };
}

export function DatabaseImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setError('Please select a JSON file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getAuthToken();
      const response = await fetch(`${API_ENDPOINTS.admin.products.replace('/products', '')}/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Import failed');
      }

      const data: ImportResult = await response.json();
      setResult(data);
      toast.success(data.message);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to import data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Import
        </CardTitle>
        <CardDescription>
          Import products, reviews, and content from a JSON export file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <label htmlFor="import-file" className="text-sm font-medium">
            Select Export File
          </label>
          <div className="flex gap-2">
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={importing}
              className="flex-1"
            />
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="min-w-[120px]"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <Alert className="border-green-500 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{result.message}</p>
                <div className="text-sm space-y-1">
                  <p>✅ New items: {result.summary.total_imported}</p>
                  <p>↻ Updated items: {result.summary.total_updated}</p>
                  {result.summary.total_errors > 0 && (
                    <p className="text-red-600">❌ Errors: {result.summary.total_errors}</p>
                  )}
                </div>
                
                {/* Detailed Stats */}
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="font-medium mb-2">Details by Collection:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(result.stats).map(([collection, stats]) => {
                      const total = stats.imported + stats.updated + stats.errors;
                      if (total === 0) return null;
                      return (
                        <div key={collection} className="bg-white p-2 rounded border border-green-200">
                          <p className="font-semibold capitalize">{collection}</p>
                          <p>New: {stats.imported} | Updated: {stats.updated}</p>
                          {stats.errors > 0 && <p className="text-red-600">Errors: {stats.errors}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
          <p className="font-semibold">📋 Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Download the export file from preview environment</li>
            <li>Click "Choose File" and select the JSON export</li>
            <li>Click "Import" to sync data to production</li>
            <li>New items will be added, existing items will be updated</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
