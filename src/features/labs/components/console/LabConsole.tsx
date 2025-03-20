import React from 'react';
import { Terminal, Maximize2, X } from 'lucide-react';

interface LabConsoleProps {
  instanceId: string;
  onClose: () => void;
  onFullscreen: () => void;
}

export const LabConsole: React.FC<LabConsoleProps> = ({
  instanceId,
  onClose,
  onFullscreen
}) => {
  return (
    <div className="fixed inset-0 bg-dark-300 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 bg-dark-200">
        <div className="flex items-center space-x-4">
          <Terminal className="h-5 w-5 text-primary-400" />
          <span className="text-gray-300 font-medium">Lab Console</span>
          <span className="text-sm text-gray-500">ID: {instanceId}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onFullscreen}
            className="p-2 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-black p-4">
        <div className="font-mono text-sm text-green-400">
          {/* Console output goes here */}
          <p>Connecting to lab instance...</p>
          <p>$ _</p>
        </div>
      </div>
    </div>
  );
};