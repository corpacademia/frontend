import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { parseCsvFile } from '../utils/csvParser';
import { validateUserData } from '../utils/userValidation';
import { UserUploadError } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (users: any[]) => Promise<void>;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<UserUploadError[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setErrors([]);

    try {
      const users = await parseCsvFile(selectedFile);
      const validationErrors = validateUserData(users);
      setErrors(validationErrors);
    } catch (error) {
      setErrors([{ row: 0, message: 'Failed to parse CSV file' }]);
    }
  };

  const handleUpload = async () => {
    if (!file || errors.length > 0) return;

    setIsUploading(true);
    try {
      const users = await parseCsvFile(file);
      await onUpload(users);
      onClose();
    } catch (error) {
      setErrors([{ row: 0, message: 'Failed to upload users' }]);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg w-full max-w-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-200">Bulk Upload Users</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-300 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-primary-500/20 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload className="h-12 w-12 text-primary-400 mb-4" />
              <span className="text-gray-300 mb-2">
                {file ? file.name : 'Drop your CSV file here or click to browse'}
              </span>
              <span className="text-sm text-gray-500">
                Maximum file size: 5MB
              </span>
            </label>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-400">
                    Please fix the following errors:
                  </h3>
                  <ul className="mt-2 text-sm text-red-300 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-primary-500/10">
            <a
              href="/templates/users-template.csv"
              download
              className="flex items-center text-sm text-primary-400 hover:text-primary-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Template
            </a>
            <div className="space-x-4">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || errors.length > 0 || isUploading}
                className="btn-primary"
              >
                {isUploading ? 'Uploading...' : 'Upload Users'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};