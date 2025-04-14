import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  buttonText?: string;
  description?: string;
}

export function FileUpload({
  onFileChange,
  accept = "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  maxSize = 10, // Default 10MB
  className,
  buttonText = "Upload file",
  description = "PNG, JPG, GIF, PDF or DOCX (max. 10MB)"
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    // Check file type if accept is provided
    if (accept) {
      const acceptedTypes = accept.split(",");
      const fileType = file.type;
      
      // For images and common file types
      if (!acceptedTypes.some(type => {
        // Handle wildcards like "image/*"
        if (type.endsWith("/*")) {
          const category = type.slice(0, -2);
          return fileType.startsWith(category);
        }
        return type === fileType;
      })) {
        setError("File type not supported");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileChange(selectedFile);
      } else {
        onFileChange(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileChange(droppedFile);
      } else {
        onFileChange(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50",
          file ? "bg-gray-50" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />
        
        {file ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1 truncate max-w-full">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Drag and drop your file here or click to browse
            </p>
            <p className="text-xs text-gray-500">{description}</p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
