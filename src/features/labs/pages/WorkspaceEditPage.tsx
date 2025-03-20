import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GradientText } from '../../../components/ui/GradientText';
import { AlertCircle, Check, Loader, X, Upload, Link as LinkIcon } from 'lucide-react';
import axios from 'axios';

interface Workspace {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'active' | 'inactive' | 'pending';
  documents: string[];
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export const WorkspaceEditPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    status: ''
  });

  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>(['']);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1/workspace_ms/getWorkspaceOnId/${workspaceId}`);
        setWorkspace(response.data.data);
        
        setFormData({
          name: response.data.data.lab_name,
          description: response.data.data.description,
          type: response.data.data.lab_type,
          status: response.data.data.status
        });

        // Set existing documents
        if (response.data.data.documents && response.data.data.documents.length > 0) {
          setExistingDocuments(response.data.data.documents);
        }

        // Initialize URLs from existing documents
        if (response.data.data.url) {
          setUrls(response.data.data.url.map((doc: any) => doc).filter(Boolean));
        }
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
        setError('Failed to load workspace');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const fileProgress: FileWithProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...fileProgress]);
    
    // Start upload simulation for each new file
    fileProgress.forEach(file => {
      simulateFileUpload(file);
    });
  };

  const simulateFileUpload = async (fileWithProgress: FileWithProgress) => {
    const steps = 100;
    const totalTime = 2000;
    const stepTime = totalTime / steps;
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      
      setFiles(prev => prev.map(f => 
        f.file === fileWithProgress.file 
          ? { 
              ...f, 
              progress: (i / steps) * 100,
              status: i === steps ? 'completed' : 'uploading'
            }
          : f
      ));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = async (documentPath: string) => {
    try {
      // Call API to remove document
      await axios.post(`http://localhost:3000/api/v1/workspace_ms/removeWorkspaceDocument`, {
        workspaceId,
        filePath: documentPath
      });

      // Update local state
      setExistingDocuments(prev => prev.filter(doc => doc !== documentPath));
    } catch (error) {
      console.error('Failed to remove document:', error);
      setError('Failed to remove document');
    }
  };

  const extractFileName = (filePath: string) => {
    const match = filePath.match(/[\w-]+(?=\.\w+$)/);
    if (match) {
      return match[0].replace(/^\d+-/, '');
    }
    return filePath;
  };

  const extractFile_Name = (filePath: string) => {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : filePath;
  };

  const handleUrlAdd = () => {
    if (currentUrl.trim()) {
      try {
        new URL(currentUrl); // Validate URL format
        setUrls(prev => [...prev, currentUrl]);
        setCurrentUrl('');
        setError(null);
      } catch (err) {
        setError('Please enter a valid URL');
      }
    }
  };

  const removeUrl = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add existing documents that weren't removed
      existingDocuments.forEach(doc => {
        formDataToSend.append('files', doc);
      });

      // Add new files
      files.forEach(fileWithProgress => {
        formDataToSend.append('files', fileWithProgress.file);
      });

      // Add URLs
      urls.forEach((url, index) => {
        if (url.trim()) {
          formDataToSend.append(`urls[${index}]`, url);
        }
      });
      console.log(formDataToSend)
      await axios.post(`http://localhost:3000/api/v1/workspace_ms/editWorkspace/${workspaceId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Workspace updated successfully');
      setTimeout(() => {
        navigate(`/dashboard/labs/workspace/${workspaceId}`);
      }, 1500);
    } catch (error) {
      console.error('Failed to update workspace:', error);
      setError('Failed to update workspace');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-300">Workspace not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">
          <GradientText>Edit Workspace</GradientText>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lab Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
            >
              <option value="">Select Type</option>
              <option value="single-vm">Single VM</option>
              <option value="cluster">Cluster</option>
              <option value="cloud-slice">Cloud Slice</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Existing Documents Section */}
          {existingDocuments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Existing Documents
              </label>
              <div className="space-y-2">
                {existingDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-300">{extractFileName(doc)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`http://localhost:3000/uploads/${extractFile_Name(doc)}`}
                        download
                        className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                      >
                        <LinkIcon className="h-4 w-4 text-primary-400" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeExistingDocument(doc)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload New Documents
            </label>
            <div 
              className="border-2 border-dashed border-primary-500/20 rounded-lg p-8"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-primary-400 mb-4" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="document-upload"
                  multiple
                />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer text-primary-400 hover:text-primary-300"
                >
                  Upload files
                </label>
                <p className="mt-1 text-sm text-gray-400">
                  or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Maximum file size: 50MB
                </p>
              </div>
            </div>

            {/* File List with Progress */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg"
                  >
                    <div className="flex-1 mr-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300 truncate">
                          {file.file.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {file.status === 'completed' ? '100%' : `${Math.round(file.progress)}%`}
                        </span>
                      </div>
                      <div className="h-1 bg-dark-400 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-500/10 rounded-lg"
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* URL Input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add Document URLs
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    placeholder="Enter document URL"
                    className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                  <LinkIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
                <button
                  type="button"
                  onClick={handleUrlAdd}
                  className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg 
                           hover:bg-primary-500/30 transition-colors"
                >
                  Add URL
                </button>
              </div>

              {/* URL List */}
              {urls.length > 0 && (
                <div className="mt-2 space-y-2">
                  {urls.map((url, index) => (
                    url.trim() && (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-dark-300/50 rounded-lg"
                      >
                        <span className="text-sm text-gray-300 truncate flex-1 mr-2">
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeUrl(index)}
                          className="p-1 hover:bg-red-500/10 rounded-lg"
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
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

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/labs/workspace/${workspaceId}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};