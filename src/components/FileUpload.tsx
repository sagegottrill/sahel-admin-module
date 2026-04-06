import { useState } from 'react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
}

export default function FileUpload({ label, accept = '.pdf,.doc,.docx', onChange }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      onChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      onChange(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
          isDragging ? 'border-[#4a9d7e] bg-green-50' : 'border-gray-300 hover:border-[#4a9d7e]'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`file-${label}`}
        />
        <label htmlFor={`file-${label}`} className="cursor-pointer">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {fileName ? (
            <p className="text-sm text-[#4a9d7e] font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">Drag and drop or click to upload</p>
              <p className="text-xs text-gray-500 mt-1">Accepted formats: {accept}</p>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
