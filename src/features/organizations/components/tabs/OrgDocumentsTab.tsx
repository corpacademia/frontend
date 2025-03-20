import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../../components/ui/GradientText';
import { 
  Upload, 
  Trash2, 
  Eye, 
  Download, 
  MoreVertical,
  Check,
  X,
  Loader,
  AlertCircle,
  FileText
} from 'lucide-react';
import axios from 'axios';

interface Document {
  id: string;
  name: string;
  format: string;
  size: number;
  uploadDate: string;
  url: string;
}

interface OrgDocumentsTabProps {
  orgId: string;
}

export const OrgDocumentsTab: React.FC<OrgDocumentsTabProps> = ({ orgId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [orgId]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/organization_ms/getOrganizationDocuments/${orgId}`);
      if (response.data.success) {
        setDocuments(response.data.data);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map(d => d.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleUploadDocument = async (files: FileList) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('documents', file);
    });
    formData.append('orgId', orgId);

    try {
      const response = await axios.post(`http://localhost:3000/api/v1/organization_ms/uploadOrganizationDocuments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('Documents uploaded successfully');
        fetchDocuments();
      } else {
        throw new Error(response.data.message || 'Failed to upload documents');
      }
    } catch (err) {
      setError('Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedDocuments.length) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`http://localhost:3000/api/v1/organization_ms/deleteOrganizationDocuments`, {
        orgId,
        documentIds: selectedDocuments
      });

      if (response.data.success) {
        setDocuments(prev => prev.filter(d => !selectedDocuments.includes(d.id)));
        setSelectedDocuments([]);
        setSuccess('Selected documents deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete documents');
      }
    } catch (err) {
      setError('Failed to delete selected documents');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          <GradientText>Documents</GradientText>
        </h2>
        <div className="flex space-x-4">
          {selectedDocuments.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="btn-secondary text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </button>
          )}
          <label className="btn-primary cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUploadDocument(e.target.files)}
            />
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-200">{success}</span>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-primary-500/10">
                <th className="pb-4 pl-4">
                  <input
                    type="checkbox"
                    checked={documents.length > 0 && selectedDocuments.length === documents.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="pb-4">Document</th>
                <th className="pb-4">Format</th>
                <th className="pb-4">Size</th>
                <th className="pb-4">Upload Date</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr 
                  key={document.id}
                  className="border-b border-primary-500/10 hover:bg-dark-300/50 transition-colors"
                >
                  <td className="py-4 pl-4">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={() => handleSelectDocument(document.id)}
                      className="rounded border-gray-400 text-primary-500 focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary-500/10">
                        <FileText className="h-5 w-5 text-primary-400" />
                      </div>
                      <span className="font-medium text-gray-200">{document.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300">
                      {document.format.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 text-gray-400">
                    {formatFileSize(document.size)}
                  </td>
                  <td className="py-4 text-gray-400">
                    {new Date(document.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Eye className="h-4 w-4 text-primary-400" />
                      </button>
                      <a
                        href={document.url}
                        download
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4 text-primary-400" />
                      </a>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                      <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};