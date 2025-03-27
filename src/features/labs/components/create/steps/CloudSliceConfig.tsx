import React, { useState } from 'react';
import { GradientText } from '../../../../../components/ui/GradientText';
import { 
  Search, 
  ChevronDown, 
  X, 
  AlertCircle, 
  Calendar, 
  Loader, 
  Check, 
  Clock 
} from 'lucide-react';

interface CloudSliceConfigProps {
  onBack: () => void;
  labDetails: {
    title: string;
    description: string;
    duration: number;
  };
}

interface Service {
  name: string;
  category: string;
  description: string;
}

const awsServiceCategories = {
  'Compute': [
    { name: 'EC2', category: 'Compute', description: 'Virtual servers in the cloud' },
    { name: 'Lambda', category: 'Compute', description: 'Run code without thinking about servers' },
    { name: 'Elastic Beanstalk', category: 'Compute', description: 'Run and manage web apps' }
  ],
  'Storage': [
    { name: 'S3', category: 'Storage', description: 'Scalable storage in the cloud' },
    { name: 'EBS', category: 'Storage', description: 'Block storage for EC2' },
    { name: 'Glacier', category: 'Storage', description: 'Low-cost archive storage' }
  ],
  'Databases': [
    { name: 'RDS', category: 'Databases', description: 'Managed relational databases' },
    { name: 'DynamoDB', category: 'Databases', description: 'Managed NoSQL database' },
    { name: 'Redshift', category: 'Databases', description: 'Data warehouse service' }
  ],
  'Networking & Content Delivery': [
    { name: 'VPC', category: 'Networking', description: 'Isolated cloud resources' },
    { name: 'CloudFront', category: 'Networking', description: 'Global content delivery network' },
    { name: 'Route 53', category: 'Networking', description: 'Scalable DNS and domain registration' }
  ],
  'Machine Learning': [
    { name: 'SageMaker', category: 'Machine Learning', description: 'Build ML models at scale' },
    { name: 'Rekognition', category: 'Machine Learning', description: 'Image and video analysis' },
    { name: 'Comprehend', category: 'Machine Learning', description: 'Natural language processing' }
  ],
  'Analytics': [
    { name: 'EMR', category: 'Analytics', description: 'Big data processing' },
    { name: 'Athena', category: 'Analytics', description: 'Query data in S3' },
    { name: 'Kinesis', category: 'Analytics', description: 'Real-time data streaming' }
  ],
  'Developer Tools': [
    { name: 'CodeCommit', category: 'Developer Tools', description: 'Source control service' },
    { name: 'CloudWatch', category: 'Developer Tools', description: 'Monitoring and observability' },
    { name: 'CloudTrail', category: 'Developer Tools', description: 'AWS API activity tracking' }
  ],
  'Security & Identity': [
    { name: 'IAM', category: 'Security', description: 'Identity and access management' },
    { name: 'GuardDuty', category: 'Security', description: 'Threat detection service' },
    { name: 'Shield', category: 'Security', description: 'DDoS protection' }
  ],
  'Migration & Transfer': [
    { name: 'Migration Hub', category: 'Migration', description: 'Track application migration' },
    { name: 'DataSync', category: 'Migration', description: 'Online data transfer service' },
    { name: 'Snowball', category: 'Migration', description: 'Large-scale data transport' }
  ],
  'IoT': [
    { name: 'IoT Core', category: 'IoT', description: 'Connect IoT devices' },
    { name: 'IoT Analytics', category: 'IoT', description: 'IoT data analytics' },
    { name: 'IoT Device Management', category: 'IoT', description: 'Manage IoT devices' }
  ],
  'Business Applications': [
    { name: 'WorkSpaces', category: 'Business', description: 'Virtual desktop service' },
    { name: 'Chime', category: 'Business', description: 'Communications service' },
    { name: 'WorkDocs', category: 'Business', description: 'Content collaboration' }
  ],
  'AR/VR': [
    { name: 'Sumerian', category: 'AR/VR', description: 'Create VR and AR applications' }
  ],
  'Blockchain': [
    { name: 'Managed Blockchain', category: 'Blockchain', description: 'Managed blockchain networks' },
    { name: 'QLDB', category: 'Blockchain', description: 'Ledger database service' }
  ],
  'Robotics': [
    { name: 'RoboMaker', category: 'Robotics', description: 'Robotics development platform' }
  ],
  'Game Development': [
    { name: 'GameLift', category: 'Gaming', description: 'Game server hosting' },
    { name: 'GameKit', category: 'Gaming', description: 'Game development tools' }
  ],
  'Cost Management': [
    { name: 'Cost Explorer', category: 'Cost', description: 'Analyze AWS spending' },
    { name: 'Pricing Calculator', category: 'Cost', description: 'Estimate AWS costs' }
  ],
  'Customer Engagement': [
    { name: 'Pinpoint', category: 'Engagement', description: 'Customer engagement service' },
    { name: 'SES', category: 'Engagement', description: 'Email service' },
    { name: 'SNS', category: 'Engagement', description: 'Notification service' }
  ],
  'Media Services': [
    { name: 'MediaConvert', category: 'Media', description: 'File-based video transcoding' },
    { name: 'MediaLive', category: 'Media', description: 'Live video processing' },
    { name: 'MediaPackage', category: 'Media', description: 'Video origination and packaging' }
  ],
  'End User Computing': [
    { name: 'AppStream 2.0', category: 'Computing', description: 'Application streaming service' },
    { name: 'WorkSpaces', category: 'Computing', description: 'Virtual desktop infrastructure' }
  ],
  'Automation': [
    { name: 'Systems Manager', category: 'Automation', description: 'AWS resource management' },
    { name: 'CloudFormation', category: 'Automation', description: 'Infrastructure as code' },
    { name: 'EventBridge', category: 'Automation', description: 'Serverless event bus' }
  ]
};

const regions = [
  { code: 'us-east-1', name: 'US East (N. Virginia)', location: 'Northern Virginia' },
  { code: 'us-west-2', name: 'US West (Oregon)', location: 'Oregon' },
  { code: 'eu-west-1', name: 'Europe (Ireland)', location: 'Ireland' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', location: 'Singapore' },
  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', location: 'Tokyo' },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)', location: 'Frankfurt' },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)', location: 'Mumbai' },
  { code: 'sa-east-1', name: 'South America (São Paulo)', location: 'São Paulo' }
];

export const CloudSliceConfig: React.FC<CloudSliceConfigProps> = ({ onBack, labDetails }) => {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState<string | null>(null);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cleanupPolicy, setCleanupPolicy] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits] = useState(10000); // Example credit amount

  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
    region.location.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.name === service.name);
      if (exists) {
        return prev.filter(s => s.name !== service.name);
      }
      return [...prev, service];
    });
  };

  const handleSubmit = async () => {
    if (!selectedRegion) {
      setError('Please select a region');
      return;
    }
    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please specify start and end dates');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const config = {
        title: labDetails.title,
        description: labDetails.description,
        services: selectedServices.map(s => s.name),
        region: selectedRegion,
        startDate,
        endDate,
        cleanupPolicy: `${cleanupPolicy}-day`,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onBack(); // Return to the list view
    } catch (err) {
      setError('Failed to create cloud slice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold">
            <GradientText>AWS Cloud Slice Configuration</GradientText>
          </h2>
          <p className="mt-2 text-gray-400">{labDetails.description}</p>
        </div>
        <div className="text-lg font-semibold text-primary-400">
          Credits Available: ${credits.toLocaleString()}
        </div>
      </div>

      {/* Services Selection */}
      <div className="glass-panel space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">AWS Services</h3>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="space-y-2">
          {Object.entries(awsServiceCategories).map(([category, services]) => (
            <div key={category} className="relative">
              <button
                onClick={() => setActiveCategoryDropdown(
                  activeCategoryDropdown === category ? null : category
                )}
                className="w-full flex items-center justify-between p-3 bg-dark-300/50 
                         hover:bg-dark-300 rounded-lg transition-colors"
              >
                <span className="text-gray-200">{category}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                  activeCategoryDropdown === category ? 'transform rotate-180' : ''
                }`} />
              </button>

              {activeCategoryDropdown === category && (
                <div className="mt-2 p-2 bg-dark-200 rounded-lg border border-primary-500/20">
                  {services
                    .filter(service => 
                      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      service.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(service => (
                      <label
                        key={service.name}
                        className="flex items-center space-x-3 p-2 hover:bg-dark-300/50 rounded-lg
                                 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.some(s => s.name === service.name)}
                          onChange={() => handleServiceToggle(service)}
                          className="form-checkbox h-4 w-4 text-primary-500 rounded 
                                   border-gray-500/20 focus:ring-primary-500"
                        />
                        <div>
                          <p className="font-medium text-gray-200">{service.name}</p>
                          <p className="text-sm text-gray-400">{service.description}</p>
                        </div>
                      </label>
                    ))
                  }
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedServices.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Services:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedServices.map(service => (
                <div
                  key={service.name}
                  className="flex items-center px-3 py-1 bg-primary-500/10 text-primary-300
                           rounded-full text-sm"
                >
                  {service.name}
                  <button
                    onClick={() => handleServiceToggle(service)}
                    className="ml-2 hover:text-primary-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Region Selection */}
      <div className="glass-panel space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Region Selection</h3>
        
        <div className="relative">
          <button
            onClick={() => setShowRegionDropdown(!showRegionDropdown)}
            className="w-full flex items-center justify-between p-3 bg-dark-300/50 
                     hover:bg-dark-300 rounded-lg transition-colors"
          >
            <span className="text-gray-200">
              {selectedRegion ? 
                regions.find(r => r.code === selectedRegion)?.name :
                'Select a region'
              }
            </span>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
              showRegionDropdown ? 'transform rotate-180' : ''
            }`} />
          </button>

          {showRegionDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-dark-200 rounded-lg border 
                          border-primary-500/20 shadow-lg">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search regions..."
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-400/50 border border-primary-500/20 
                           rounded-lg text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredRegions.map(region => (
                  <button
                    key={region.code}
                    onClick={() => {
                      setSelectedRegion(region.code);
                      setShowRegionDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-dark-300/50 transition-colors"
                  >
                    <p className="text-gray-200">{region.name}</p>
                    <p className="text-sm text-gray-400">{region.location}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duration and Cleanup */}
      <div className="glass-panel space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Duration & Cleanup</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cleanup Policy
          </label>
          <select
            value={cleanupPolicy}
            onChange={(e) => setCleanupPolicy(e.target.value)}
            className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                     text-gray-300 focus:border-primary-500/40 focus:outline-none"
          >
            <option value="1">1-day cleanup</option>
            <option value="2">2-day cleanup</option>
            <option value="3">3-day cleanup</option>
            <option value="7">7-day cleanup</option>
          </select>
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

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <Loader className="animate-spin h-4 w-4 mr-2" />
              Creating Cloud Slice...
            </span>
          ) : (
            'Create Cloud Slice'
          )}
        </button>
      </div>
    </div>
  );
};