import React, { useState } from 'react';
import { GradientText } from '../../../../../components/ui/GradientText';
import { 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  Minus, 
  Monitor, 
  Server, 
  Network, 
  User, 
  Key, 
  AlertCircle 
} from 'lucide-react';

interface DatacenterConfigProps {
  config: {
    numberOfUsers: number;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    protocol: string;
    users: Array<{
      ip: string;
      port: string;
      username: string;
      password: string;
    }>;
  };
  onChange: (config: DatacenterConfigProps['config']) => void;
}

export const DatacenterConfig: React.FC<DatacenterConfigProps> = ({ config, onChange }) => {
  const [formData, setFormData] = useState(config);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleUserChange = (index: number, field: string, value: string) => {
    const updatedUsers = [...formData.users];
    updatedUsers[index] = { ...updatedUsers[index], [field]: value };
    setFormData(prev => ({ ...prev, users: updatedUsers }));
    setError(null);
  };

  const addUser = () => {
    const defaultPort = formData.protocol === 'rdp' ? '3389' : 
                        formData.protocol === 'ssh' ? '22' : 
                        formData.protocol === 'vnc' ? '5900' : '3389';

    const updatedUsers = [...formData.users, { ip: '', port: defaultPort, username: '', password: '' }];
    setFormData(prev => ({
      ...prev,
      users: updatedUsers,
      numberOfUsers: updatedUsers.length // Update numberOfUsers to match the actual count
    }));
  };

  const removeUser = (index: number) => {
    if (formData.users.length <= 1) return;

    const updatedUsers = formData.users.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      users: updatedUsers,
      numberOfUsers: updatedUsers.length // Update numberOfUsers to match the actual count
    }));
  };

  const updateNumberOfUsers = (num: number) => {
    const newNum = Math.max(1, num);

    // Update the number of users
    setFormData(prev => {
      const currentUsers = [...prev.users];

      // If increasing, add new users
      if (newNum > currentUsers.length) {
        const defaultPort = prev.protocol === 'rdp' ? '3389' : 
                           prev.protocol === 'ssh' ? '22' : 
                           prev.protocol === 'vnc' ? '5900' : '3389';

        const newUsers = Array(newNum - currentUsers.length).fill(0).map(() => ({
          ip: '',
          port: defaultPort,
          username: '',
          password: ''
        }));

        return {
          ...prev,
          numberOfUsers: newNum,
          users: [...currentUsers, ...newUsers]
        };
      }

      // If decreasing, remove excess users
      if (newNum < currentUsers.length) {
        return {
          ...prev,
          numberOfUsers: newNum,
          users: currentUsers.slice(0, newNum)
        };
      }

      return { ...prev, numberOfUsers: newNum };
    });
  };

  const handleProtocolChange = (protocol: string) => {
    const defaultPort = protocol === 'rdp' ? '3389' : 
                       protocol === 'ssh' ? '22' : 
                       protocol === 'vnc' ? '5900' : '3389';

    // Update all users' ports to the default for the selected protocol
    const updatedUsers = formData.users.map(user => ({
      ...user,
      port: defaultPort
    }));

    setFormData(prev => ({
      ...prev,
      protocol,
      users: updatedUsers
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.startDate || !formData.startTime) {
      setError('Please select a start date and time');
      return false;
    }

    if (!formData.endDate || !formData.endTime) {
      setError('Please select an end date and time');
      return false;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      setError('End date and time must be after start date and time');
      return false;
    }

    // Validate user details
    for (let i = 0; i < formData.users.length; i++) {
      const user = formData.users[i];
      if (!user.ip) {
        setError(`User ${i + 1}: IP address is required`);
        return false;
      }

      if (!user.port) {
        setError(`User ${i + 1}: Port is required`);
        return false;
      }

      if (!user.username) {
        setError(`User ${i + 1}: Username is required`);
        return false;
      }

      if (!user.password) {
        setError(`User ${i + 1}: Password is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {

    if (validateForm()) {
      const storedData = JSON.parse(localStorage.getItem('formData') || '{}');
      const updatedData = { ...storedData, datacenterConfig: formData };
      localStorage.setItem('formData', JSON.stringify(updatedData));
      onChange(formData);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-semibold">
        <GradientText>Datacenter Configuration</GradientText>
      </h2>

      <div className="glass-panel space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Number of Users */}
          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <Users className="h-4 w-4 mr-2 text-primary-400" />
              Number of Users
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => updateNumberOfUsers(formData.numberOfUsers - 1)}
                className="p-2 bg-dark-400/50 border border-primary-500/20 rounded-l-lg text-gray-400 hover:bg-dark-300 transition-colors"
                disabled={formData.numberOfUsers <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="1"
                value={formData.numberOfUsers}
                onChange={(e) => updateNumberOfUsers(parseInt(e.target.value) || 1)}
                className="w-20 px-4 py-2 bg-dark-400/50 border-y border-primary-500/20 text-center
                         text-gray-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => updateNumberOfUsers(formData.numberOfUsers + 1)}
                className="p-2 bg-dark-400/50 border border-primary-500/20 rounded-r-lg text-gray-400 hover:bg-dark-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Protocol Selection */}
          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <Network className="h-4 w-4 mr-2 text-primary-400" />
              Connection Protocol
            </label>
            <select
              name="protocol"
              value={formData.protocol}
              onChange={(e) => handleProtocolChange(e.target.value)}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            >
              <option value="rdp">RDP (Remote Desktop Protocol)</option>
              <option value="ssh">SSH (Secure Shell)</option>
              <option value="vnc">VNC (Virtual Network Computing)</option>
            </select>
          </div>
        </div>

        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <Calendar className="h-4 w-4 mr-2 text-primary-400" />
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <Clock className="h-4 w-4 mr-2 text-primary-400" />
              Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <Calendar className="h-4 w-4 mr-2 text-primary-400" />
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center text-gray-300 mb-2">
              <Clock className="h-4 w-4 mr-2 text-primary-400" />
              End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                       text-gray-300 focus:border-primary-500/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* User Credentials Section */}
      <div className="glass-panel">
        <h3 className="text-xl font-semibold mb-6">
          <GradientText>User Credentials</GradientText>
        </h3>

        <div className="space-y-6">
          {formData.users.map((user, index) => (
            <div key={index} className="p-4 bg-dark-300/50 rounded-lg border border-primary-500/10">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-200 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-400" />
                  User {index + 1}
                </h4>
                {formData.users.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUser(index)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={user.ip}
                    onChange={(e) => handleUserChange(index, 'ip', e.target.value)}
                    placeholder="e.g., 192.168.1.100"
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="text"
                    value={user.port}
                    onChange={(e) => handleUserChange(index, 'port', e.target.value)}
                    placeholder={formData.protocol === 'rdp' ? '3389' : 
                                formData.protocol === 'ssh' ? '22' : '5900'}
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                             text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={user.username}
                      onChange={(e) => handleUserChange(index, 'username', e.target.value)}
                      placeholder="Enter username"
                      className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={user.password}
                      onChange={(e) => handleUserChange(index, 'password', e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                    <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addUser}
            className="w-full p-3 border border-dashed border-primary-500/30 rounded-lg
                     text-primary-400 hover:text-primary-300 hover:border-primary-500/50
                     transition-colors flex items-center justify-center text-gray-200"
          >
            <Plus className="h-5 w-5 mr-2 text-gray-200" />
            Add User
          </button>
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

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 text-base font-semibold rounded-lg
                   bg-gradient-to-r from-primary-500 to-secondary-500
                   hover:from-primary-400 hover:to-secondary-400
                   text-white shadow-lg shadow-primary-500/20
                   transform hover:scale-105 transition-all duration-300
                   min-w-[200px] focus:outline-none focus:ring-2 
                   focus:ring-primary-500/50 focus:ring-offset-2 
                   focus:ring-offset-dark-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
};