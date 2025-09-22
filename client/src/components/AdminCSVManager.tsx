import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText, CheckCircle, AlertCircle } from "lucide-react";

export function AdminCSVManager() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Array<{ name: string; version?: string }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: adminApi.uploadSoftwareCSV,
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/software"] });
      setCsvFile(null);
      setCsvData([]);
      // Reset file input
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
    },
  });

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must have at least a header row and one data row",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length >= 1 && values[0]) { // At least name is required
          data.push({
            name: values[0],
            version: values[1] || undefined,
          });
        }
      }

      setCsvData(data);
      toast({
        title: "CSV Parsed",
        description: `Found ${data.length} software items`,
      });
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setCsvFile(file);
      parseCsvFile(file);
    }
  };

  const handleUpload = () => {
    if (csvData.length === 0) {
      toast({
        title: "No Data",
        description: "Please select and parse a CSV file first",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(csvData);
  };

  const handleDownloadSample = () => {
    adminApi.downloadSampleCSV();
    toast({
      title: "Download Started",
      description: "Sample CSV template is being downloaded",
    });
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Software Catalog CSV Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Download Sample Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Download Sample Template</h3>
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleDownloadSample}
                    variant="outline"
                    className="flex items-center gap-2"
                    data-testid="button-download-sample"
                  >
                    <Download className="h-4 w-4" />
                    Download Sample CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download a CSV template with sample software data that you can modify and upload</p>
                </TooltipContent>
              </Tooltip>
              <p className="text-sm text-muted-foreground">
                Download a template with the correct format for software data
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Upload Software CSV</h3>
            
            <Alert className="bg-accent/30 border-accent">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>CSV Format:</strong> The CSV file should have columns "name" and "version" (optional). 
                First row should be headers: name,version
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Input
                      id="csv-file-input"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="max-w-sm"
                      data-testid="input-csv-file"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select a CSV file containing software names and versions to add to the catalog</p>
                </TooltipContent>
              </Tooltip>
              
              {csvFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {csvFile.name} ({csvData.length} items)
                </div>
              )}
            </div>

            {csvData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Preview ({csvData.length} items):</h4>
                <div className="max-h-32 overflow-y-auto bg-accent/30 p-3 rounded border">
                  {csvData.slice(0, 5).map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.name} {item.version ? `(${item.version})` : ''}
                    </div>
                  ))}
                  {csvData.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {csvData.length - 5} more items
                    </div>
                  )}
                </div>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleUpload}
                  disabled={csvData.length === 0 || uploadMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-upload-csv"
                >
                  <Upload className="h-4 w-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload Software CSV"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload the parsed CSV data to add software items to the catalog</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}