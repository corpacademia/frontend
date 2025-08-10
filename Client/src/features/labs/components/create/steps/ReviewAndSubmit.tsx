import React from 'react';
import { Check, FileText } from 'lucide-react';

interface ReviewAndSubmitProps {
  data: any;
  documents?: File[];
  userGuides?: File[];
  onPrevious: () => void;
  onSubmit: () => void;
}

export const ReviewAndSubmit: React.FC<ReviewAndSubmitProps> = ({
  data,
  documents = [],
  userGuides = [],
  onPrevious,
  onSubmit
}) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-white">Review and Submit</h2>
          <p className="text-gray-400">
            Please review the details of your CloudSlice lab before submitting.
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Lab Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Lab Name</h4>
              <p className="text-sm text-gray-400">{data.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
              <p className="text-sm text-gray-400">{data.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Cloud Provider</h4>
              <p className="text-sm text-gray-400">{data.cloudProvider}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Region</h4>
              <p className="text-sm text-gray-400">{data.region}</p>
            </div>
            {data.isModular && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Modules</h4>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-gray-400">Configured with modules</p>
                </div>
              </div>
            )}
            {!data.isModular && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Is Modular</h4>
                <p className="text-sm text-gray-400">No</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        {!data.isModular && (documents.length > 0 || userGuides.length > 0) && (
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Lab Documents</h4>
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
                        <FileText className="h-4 w-4" />
                        <span>{doc.name}</span>
                        <span className="text-xs">({(doc.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {userGuides.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">User Guides</h4>
                  <div className="space-y-2">
                    {userGuides.map((guide, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
                        <FileText className="h-4 w-4" />
                        <span>{guide.name}</span>
                        <span className="text-xs">({(guide.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-8">
        <button
          type="button"
          onClick={onPrevious}
          className="btn-secondary"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="btn-primary"
        >
          Create Lab
        </button>
      </div>
    </div>
  );
};