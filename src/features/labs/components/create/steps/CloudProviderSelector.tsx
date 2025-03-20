import React, { useState } from 'react';
import { GradientText } from '../../../../../components/ui/GradientText';

interface CloudProviderSelectorProps {
  onSelect: (provider: string) => void;
}

export const CloudProviderSelector: React.FC<CloudProviderSelectorProps> = ({ onSelect }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const handleData = (provider: string) => {
    const storedData = JSON.parse(localStorage.getItem('formData') || '{}');
    const updatedData = { ...storedData, provider };
    localStorage.setItem('formData', JSON.stringify(updatedData));
  };

  const providers = [
    {
      id: 'aws',
      name: 'Amazon Web Services',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
      regions: 25,
      services: 200
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg',
      regions: 60,
      services: 180
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>Select Cloud Provider</GradientText>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => {
              setSelectedProvider(provider.id);
              onSelect(provider.id);
              handleData(provider.id);
            }}
            className="glass-panel hover:scale-[1.02] transition-transform text-left"
          >
            <div className="flex items-center space-x-4 p-4">
              <img 
                src={provider.logo} 
                alt={provider.name} 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-200">
                  {provider.name}
                </h3>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
                  <span>{provider.regions} Regions</span>
                  <span>•</span>
                  <span>{provider.services}+ Services</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};