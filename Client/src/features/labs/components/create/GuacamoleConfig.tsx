
import React from 'react';
import { Monitor, Globe } from 'lucide-react';

interface GuacamoleConfigProps {
  guacamoleName: string;
  guacamoleUrl: string;
  onGuacamoleNameChange: (name: string) => void;
  onGuacamoleUrlChange: (url: string) => void;
}

export const GuacamoleConfig: React.FC<GuacamoleConfigProps> = ({
  guacamoleName,
  guacamoleUrl,
  onGuacamoleNameChange,
  onGuacamoleUrlChange,
}) => {
  return (
    <div className="glass-panel space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="h-5 w-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-gray-200">Guacamole Configuration</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Guacamole Name
          </label>
          <div className="relative">
            <Monitor className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={guacamoleName}
              onChange={(e) => onGuacamoleNameChange(e.target.value)}
              placeholder="Enter Guacamole instance name"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg 
                       text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-primary-500/50 focus:border-primary-500/50"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Unique name to identify this Guacamole instance
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Guacamole URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={guacamoleUrl}
              onChange={(e) => onGuacamoleUrlChange(e.target.value)}
              placeholder="https://guacamole.example.com"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg 
                       text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-primary-500/50 focus:border-primary-500/50"
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Full URL to access the Guacamole instance
          </p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Monitor className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium">About Guacamole</p>
            <p className="text-blue-200/80 mt-1">
              Apache Guacamole provides remote desktop access to lab environments through a web browser.
              This configuration enables students to access VMs and lab resources seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
