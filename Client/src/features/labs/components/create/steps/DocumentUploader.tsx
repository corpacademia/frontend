import React, { useRef, useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface DocumentUploaderProps {
  onDocumentsChange: (documents: File[]) => void;
  onUserGuidesChange: (guides: File[]) => void;
  onNext?: () => void; // Added onNext prop
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentsChange,
  onUserGuidesChange,
  onNext
}) => {
  const [documents, setDocuments] = useState<File[]>([]);
  const [userGuides, setUserGuides] = useState<File[]>([]);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const guideInputRef = useRef<HTMLInputElement>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [userGuideText, setUserGuideText] = useState<string>('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'document' | 'guide') => {
    e.preventDefault();
    e.stopPropagation();
    setDocumentError(null);

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const files = Array.from(e.dataTransfer.files);

    // Validate file types
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setDocumentError('Only PDF and Word documents are allowed');
      setTimeout(() => setDocumentError(null), 5000);
      return;
    }

    // Validate file sizes (1GB limit)
    const oversizedFiles = files.filter(file => file.size > 1 * 1024 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setDocumentError('Files must be smaller than 1GB');
      setTimeout(() => setDocumentError(null), 5000);
      return;
    }

    if (type === 'document') {
      const updatedDocs = [...documents, ...files];
      setDocuments(updatedDocs);
      onDocumentsChange(updatedDocs);
    } else {
      const updatedGuides = [...userGuides, ...files];
      setUserGuides(updatedGuides);
      onUserGuidesChange(updatedGuides);
    }
  };

  const handleFileSelect = async (
  e: React.ChangeEvent<HTMLInputElement>,
  type: 'document' | 'guide'
) => {
  setDocumentError(null);
  if (!e.target.files || e.target.files.length === 0) return;

  const files = Array.from(e.target.files);

  // Validate file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const invalidFiles = files.filter((file) => !allowedTypes.includes(file.type));
  if (invalidFiles.length > 0) {
    setDocumentError('Only PDF and Word documents are allowed');
    setTimeout(() => setDocumentError(null), 5000);
    return;
  }

  // Validate file sizes (1GB limit)
  const oversizedFiles = files.filter((file) => file.size > 1 * 1024 * 1024 * 1024);
  if (oversizedFiles.length > 0) {
    setDocumentError('Files must be smaller than 1GB');
    setTimeout(() => setDocumentError(null), 5000);
    return;
  }

  // Convert files to base64-encoded objects
  const readFilesAsBase64 = async (files: File[]) => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise<{ name: string; type: string; size: number; content: string }>(
            (resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  content: reader.result as string,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }
          )
      )
    );
  };

  const base64Files = await readFilesAsBase64(files);
  const storedData = JSON.parse(localStorage.getItem('formData') || '{}');

  if (type === 'document') {
    const updatedDocs = [...documents, ...files];
    const existingBase64Docs = storedData.labGuides || [];
    const updatedData = {
      ...storedData,
      labGuides: [...existingBase64Docs, ...base64Files],
    };
    localStorage.setItem('formData', JSON.stringify(updatedData));
    setDocuments(updatedDocs);
    onDocumentsChange(updatedDocs);
  } else {
    const updatedGuides = [...userGuides, ...files];
    const existingBase64Guides = storedData.userGuides || [];
    const updatedData = {
      ...storedData,
      userGuides: [...existingBase64Guides, ...base64Files],
    };
    localStorage.setItem('formData', JSON.stringify(updatedData));
    setUserGuides(updatedGuides);
    onUserGuidesChange(updatedGuides);
  }
};

const handleRemoveDocument = (index: number, type: 'document' | 'guide') => {
  const storedData = JSON.parse(localStorage.getItem('formData') || '{}');

  if (type === 'document') {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    onDocumentsChange(updatedDocs);

    // Remove from localStorage
    const base64Docs = storedData.labGuides || [];
    base64Docs.splice(index, 1); // remove the file at the same index
    const updatedData = {
      ...storedData,
      labGuides: base64Docs,
    };
    localStorage.setItem('formData', JSON.stringify(updatedData));
  } else {
    const updatedGuides = userGuides.filter((_, i) => i !== index);
    setUserGuides(updatedGuides);
    onUserGuidesChange(updatedGuides);

    // Remove from localStorage
    const base64Guides = storedData.userGuides || [];
    base64Guides.splice(index, 1); // remove the file at the same index
    const updatedData = {
      ...storedData,
      userGuides: base64Guides,
    };
    localStorage.setItem('formData', JSON.stringify(updatedData));
  }
};


  const handleContinue = () => {
    if (onNext) {
      onNext();
    }
  };

  const convertTextToPdf = (text: string, type: 'document' | 'guide'): File => {
    const doc = new jsPDF();
    const title = type === 'document' ? 'Lab Document' : 'User Guide';

    // Add title
    doc.setFontSize(16);
    doc.text(title, 20, 20);

    // Add content with word wrapping
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, 30);

    // Generate file name
    const fileName = type === 'document' 
      ? `lab-document-${Date.now()}.pdf` 
      : `user-guide-${Date.now()}.pdf`;

    // Convert to blob and then to File
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    return pdfFile;
  };

  const handleTextSubmit = (type: 'document' | 'guide') => {
    const text = type === 'document' ? documentText : userGuideText;

    if (!text.trim()) {
      setDocumentError(`Please enter some text for the ${type === 'document' ? 'document' : 'guide'}`);
      setTimeout(() => setDocumentError(null), 5000);
      return;
    }

    try {
      const pdfFile = convertTextToPdf(text, type);

      if (type === 'document') {
        const updatedDocs = [...documents, pdfFile];
        setDocuments(updatedDocs);
        onDocumentsChange(updatedDocs);
        setDocumentText('');

        // Update localStorage
        const storedData = JSON.parse(localStorage.getItem('formData') || '{}');
        const reader = new FileReader();
        reader.onload = () => {
          const base64Content = reader.result as string;
          const existingBase64Docs = storedData.labGuides || [];
          const newFileData = {
            name: pdfFile.name,
            type: pdfFile.type,
            size: pdfFile.size,
            content: base64Content
          };

          const updatedData = {
            ...storedData,
            labGuides: [...existingBase64Docs, newFileData],
          };
          localStorage.setItem('formData', JSON.stringify(updatedData));
        };
        reader.readAsDataURL(pdfFile);
      } else {
        const updatedGuides = [...userGuides, pdfFile];
        setUserGuides(updatedGuides);
        onUserGuidesChange(updatedGuides);
        setUserGuideText('');

        // Update localStorage
        const storedData = JSON.parse(localStorage.getItem('formData') || '{}');
        const reader = new FileReader();
        reader.onload = () => {
          const base64Content = reader.result as string;
          const existingBase64Guides = storedData.userGuides || [];
          const newFileData = {
            name: pdfFile.name,
            type: pdfFile.type,
            size: pdfFile.size,
            content: base64Content
          };

          const updatedData = {
            ...storedData,
            userGuides: [...existingBase64Guides, newFileData],
          };
          localStorage.setItem('formData', JSON.stringify(updatedData));
        };
        reader.readAsDataURL(pdfFile);
      }
    } catch (error) {
      console.error('Error creating PDF:', error);
      setDocumentError('Failed to create PDF from text');
      setTimeout(() => setDocumentError(null), 5000);
    }
  };

  const renderDocumentUploader = (type: 'document' | 'guide') => {
    const files = type === 'document' ? documents : userGuides;
    const inputRef = type === 'document' ? fileInputRef : guideInputRef;
    const title = type === 'document' ? 'Lab Documents' : 'User Guides';
    const description = type === 'document' 
      ? 'Upload lab materials, exercises, and reference documents' 
      : 'Upload user guides and instructions for lab participants';
    const textValue = type === 'document' ? documentText : userGuideText;
    const setTextValue = type === 'document' ? setDocumentText : setUserGuideText;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>
        <div 
          className="border-2 border-dashed border-primary-500/20 rounded-lg p-6 mb-4 hover:border-primary-500/40 transition-colors"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, type)}
        >
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-primary-400/50 mb-4" />
            <input
              type="file"
              ref={inputRef}
              onChange={(e) => handleFileSelect(e, type)}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Upload files
            </button>
            <p className="mt-2 text-sm text-gray-400">
              or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {description}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX up to 1GB
            </p>
          </div>
        </div>

        {/* Text to PDF converter */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Or create from text:</h4>
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder={`Enter text for ${type === 'document' ? 'lab document' : 'user guide'}`}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none
                     min-h-[150px] resize-y"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => handleTextSubmit(type)}
              className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg 
                       hover:bg-primary-500/30 transition-colors"
            >
              Convert to PDF
            </button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Uploaded files:</h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-primary-400 mr-2" />
                  <span className="text-sm text-white truncate max-w-md">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-300">({(file.size / (1024 * 1024) ).toFixed(1)} MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(index, type)}
                  className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-400 mb-6">Lab Documents</h2>
      <p className="text-gray-400 mb-6">
        Upload documents and guides for your lab environment. These will be available to users during the lab session.
      </p>

      {documentError && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg mb-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{documentError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {renderDocumentUploader('document')}
        </div>
        <div className="space-y-4">
          {renderDocumentUploader('guide')}
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          className="btn-primary"
        >
          Continue
        </button>
      </div>
    </div>
  );
};