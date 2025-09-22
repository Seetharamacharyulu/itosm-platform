import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
    objectPath: string;
  }>;
  onComplete?: (files: {
    name: string;
    size: number;
    type: string;
    uploadURL: string;
    objectPath: string;
  }[]) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and handles file uploads.
 * 
 * Features:
 * - Renders as a customizable button that opens a file selection dialog
 * - Handles file validation (size, number of files)
 * - Uploads files directly to object storage using presigned URLs
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate number of files
    if (files.length > maxNumberOfFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload up to ${maxNumberOfFiles} file(s) at a time.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `File size must be less than ${(maxFileSize / 1024 / 1024).toFixed(2)} MB.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadedFiles: {
      name: string;
      size: number;
      type: string;
      uploadURL: string;
      objectPath: string;
    }[] = [];

    try {
      for (const file of files) {
        const { url, objectPath } = await onGetUploadParameters();
        
        const response = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (response.ok) {
          uploadedFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            uploadURL: url,
            objectPath: objectPath,
          });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      onComplete?.(uploadedFiles);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file(s). Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxNumberOfFiles > 1}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="*/*"
      />
      <Button
        onClick={handleButtonClick}
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : children}
      </Button>
    </div>
  );
}