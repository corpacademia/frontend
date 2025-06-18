import { GradientText } from '../../../../../components/ui/GradientText';
import React, { useState } from 'react';
import { 
  Server, 
  Plus, 
  Minus, 
  AlertCircle,
  Trash2,
  User,
  Calendar,
  Clock,
  Users
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface VM {
  id: string;
  name: string;
  protocol: string;
}

interface UserVM {
  vmId: string;
  username: string;
  password: string;
  ip: string;
  port: string;
}

interface ClusterConfigProps {
  config: {
    numberOfVMs: number;
    vms: VM[];
    users: Array<{
      groupName: string;
      userVMs: UserVM[];
    }>;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  };
  onChange: (config: ClusterConfigProps['config']) => void;
}

export const ClusterConfig: React.FC<ClusterConfigProps> = ({ config, onChange }) => {
  const [error, setError] = useState<string | null>(null);
  
  // Date and Time fields
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Step 1: Configure VMs
  const [numberOfVMs, setNumberOfVMs] = useState(1);
  const [vms, setVMs] = useState<VM[]>([
    { id: uuidv4(), name: 'VM 1', protocol: 'rdp' }
  ]);
  
  // Step 2: Configure Users
  const [numberOfUsers, setNumberOfUsers] = useState(1);
  const [users, setUsers] = useState<Array<{ groupName: string; userVMs: UserVM[] }>>([
    { 
      groupName: 'User Group 1',
      userVMs: [
        { vmId: vms[0].id, username: '', password: '', ip: '', port: '3389' }
      ] 
    }
  ]);

  // Handle VM count change
  const handleVMCountChange = (count: number) => {
    const newCount = Math.max(1, count);
    setNumberOfVMs(newCount);
    
    // Update VMs array based on new count
    if (newCount > vms.length) {
      // Add new VMs
      const newVMs = [...vms];
      for (let i = vms.length; i < newCount; i++) {
        newVMs.push({ 
          id: uuidv4(),
          name: `VM ${i + 1}`, 
          protocol: 'rdp' 
        });
      }
      setVMs(newVMs);
      
      // Update all users to have entries for the new VMs
      const updatedUsers = users.map(user => {
        const updatedUserVMs = [...user.userVMs];
        for (let i = user.userVMs.length; i < newCount; i++) {
          const defaultPort = newVMs[i].protocol === 'rdp' ? '3389' : 
                             newVMs[i].protocol === 'ssh' ? '22' : '5900';
          updatedUserVMs.push({
            vmId: newVMs[i].id,
            username: '',
            password: '',
            ip: '',
            port: defaultPort
          });
        }
        return { ...user, userVMs: updatedUserVMs };
      });
      setUsers(updatedUsers);
    } else if (newCount < vms.length) {
      // Remove excess VMs
      const removedVMs = vms.slice(newCount);
      const remainingVMs = vms.slice(0, newCount);
      setVMs(remainingVMs);
      
      // Remove corresponding VM entries from all users
      const removedVMIds = removedVMs.map(vm => vm.id);
      const updatedUsers = users.map(user => ({
        ...user,
        userVMs: user.userVMs.filter(userVM => !removedVMIds.includes(userVM.vmId))
      }));
      setUsers(updatedUsers);
    }
  };

  // Handle VM name or protocol change
  const handleVMChange = (vmIndex: number, field: keyof Omit<VM, 'id'>, value: string) => {
    const updatedVMs = [...vms];
    updatedVMs[vmIndex] = {
      ...updatedVMs[vmIndex],
      [field]: value
    };
    setVMs(updatedVMs);
    
    // If protocol changed, update default ports for all users
    if (field === 'protocol') {
      const defaultPort = value === 'rdp' ? '3389' : value === 'ssh' ? '22' : '5900';
      const vmId = updatedVMs[vmIndex].id;
      const updatedUsers = users.map(user => ({
        ...user,
        userVMs: user.userVMs.map(userVM => 
          userVM.vmId === vmId 
            ? { ...userVM, port: defaultPort }
            : userVM
        )
      }));
      setUsers(updatedUsers);
    }
    
    setError(null);
  };

  // Handle removing a specific VM
  const handleRemoveVM = (vmIndex: number) => {
    if (vms.length <= 1) return; // Don't remove the last VM
    
    const vmToRemove = vms[vmIndex];
    const vmIdToRemove = vmToRemove.id;
    
    // Remove the VM
    const updatedVMs = [...vms];
    updatedVMs.splice(vmIndex, 1);
    
    // Renumber VM names if they follow the default pattern and update IDs
    const renamedVMs = updatedVMs.map((vm, idx) => {
      // Only rename if it follows the pattern "VM X"
      if (/^VM \d+$/.test(vm.name)) {
        return { ...vm, id: uuidv4(), name: `VM ${idx + 1}` };
      }
      return { ...vm, id: uuidv4() };
    });
    
    setVMs(renamedVMs);
    setNumberOfVMs(renamedVMs.length);
    
    // Update all users to remove entries for the deleted VM and remap vmIds
    const updatedUsers = users.map(user => {
      // Remove the VM entry
      const filteredVMs = user.userVMs.filter(userVM => userVM.vmId !== vmIdToRemove);
      
      // Remap vmIds to match the new VM IDs
      const remappedVMs = filteredVMs.map(userVM => {
        const correspondingVM = renamedVMs.find((vm, idx) => {
          // Find the VM that was originally at this position
          const originalVMIndex = vms.findIndex(v => v.id === userVM.vmId);
          return originalVMIndex > vmIndex ? idx === originalVMIndex - 1 : idx === originalVMIndex;
        });
        
        return {
          ...userVM,
          vmId: correspondingVM ? correspondingVM.id : userVM.vmId
        };
      });
      
      return { ...user, userVMs: remappedVMs };
    });
    
    setUsers(updatedUsers);
  };

  // Handle user count change
  const handleUserCountChange = (count: number) => {
    const newCount = Math.max(1, count);
    setNumberOfUsers(newCount);
    
    // Update users array based on new count
    if (newCount > users.length) {
      // Add new users
      const newUsers = [...users];
      for (let i = users.length; i < newCount; i++) {
        const userVMs = vms.map((vm) => {
          const defaultPort = vm.protocol === 'rdp' ? '3389' : 
                             vm.protocol === 'ssh' ? '22' : '5900';
          return {
            vmId: vm.id,
            username: '',
            password: '',
            ip: '',
            port: defaultPort
          };
        });
        newUsers.push({ 
          groupName: `User Group ${i + 1}`,
          userVMs 
        });
      }
      setUsers(newUsers);
    } else if (newCount < users.length) {
      // Remove excess users
      setUsers(users.slice(0, newCount));
    }
  };

  // Handle removing a specific user
  const handleRemoveUser = (userIndex: number) => {
    if (users.length <= 1) return; // Don't remove the last user
    
    const updatedUsers = [...users];
    updatedUsers.splice(userIndex, 1);
    setUsers(updatedUsers);
    setNumberOfUsers(updatedUsers.length);
  };

  // Handle user group name change
  const handleUserGroupNameChange = (userIndex: number, groupName: string) => {
    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      groupName: groupName
    };
    setUsers(updatedUsers);
    setError(null);
  };

  // Handle user VM field change
  const handleUserVMChange = (userIndex: number, vmId: number, field: keyof UserVM, value: string) => {
    const updatedUsers = [...users];
    const userVM = updatedUsers[userIndex].userVMs.find(uvm => uvm.vmId === vmId);
    
    if (userVM) {
      if (field === 'vmId') {
        userVM[field] = parseInt(value as string);
      } else {
        userVM[field] = value;
      }
      setUsers(updatedUsers);
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    // Check if start date and time are provided
    if (!startDate || !startTime) {
      setError('Please provide start date and time');
      return false;
    }
    
    // Check if end date and time are provided
    if (!endDate || !endTime) {
      setError('Please provide end date and time');
      return false;
    }
    
    // Check if end date/time is after start date/time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      setError('End date and time must be after start date and time');
      return false;
    }
    
    // Check if all VMs have names and protocols
    for (let i = 0; i < vms.length; i++) {
      if (!vms[i].name || !vms[i].protocol) {
        setError(`Please provide a name and protocol for VM ${i + 1}`);
        return false;
      }
    }
    
    // Check if all user groups have names
    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      if (!users[userIndex].groupName) {
        setError(`Please provide a group name for User ${userIndex + 1}`);
        return false;
      }
    }
    
    // Check if all user VM fields are filled
    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      const user = users[userIndex];
      for (let vmIndex = 0; vmIndex < user.userVMs.length; vmIndex++) {
        const userVM = user.userVMs[vmIndex];
        if (!userVM.username || !userVM.password || !userVM.ip || !userVM.port) {
          const vm = vms.find(v => v.id === userVM.vmId);
          const vmName = vm ? vm.name : `VM ${userVM.vmId + 1}`;
          setError(`Please fill all fields for User ${userIndex + 1}, ${vmName}`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Prepare data for submission
    const clusterConfig = {
      numberOfVMs,
      vms,
      users,
      startDate,
      startTime,
      endDate,
      endTime
    };
    console.log(users)
    // Store in localStorage
    const storedData = JSON.parse(localStorage.getItem('formData') || '{}');
    const updatedData = { ...storedData, clusterConfig };
    localStorage.setItem('formData', JSON.stringify(updatedData));

    // Call onChange to proceed to next step
    onChange(clusterConfig);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">
          <GradientText>VM Cluster Configuration</GradientText>
        </h2>
        
        <div className="bg-gray-500 rounded-xl p-6 space-y-6">
          {/* Date and Time Configuration */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Schedule Configuration</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date and Time */}
              <div className="space-y-4">
                <h4 className="font-medium text-white flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Start Date & Time</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setError(null);
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg
                               text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                               [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        setError(null);
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg
                               text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                               [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* End Date and Time */}
              <div className="space-y-4">
                <h4 className="font-medium text-white flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <span>End Date & Time</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setError(null);
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg
                               text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                               [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setError(null);
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg
                               text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                               [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Configure VMs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Server className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Number of VMs</h3>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleVMCountChange(numberOfVMs - 1)}
                  className="p-2 bg-gray-600 border border-gray-500 rounded-l-lg text-white hover:bg-gray-700 transition-colors"
                  disabled={numberOfVMs <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={numberOfVMs}
                  onChange={(e) => handleVMCountChange(parseInt(e.target.value) || 1)}
                  className="w-20 px-4 py-2 bg-gray-600 border-y border-gray-500 text-center
                           text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleVMCountChange(numberOfVMs + 1)}
                  className="p-2 bg-gray-600 border border-gray-500 rounded-r-lg text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              {vms.map((vm, vmIndex) => (
                <div key={vm.id} className="p-4 bg-gray-600 rounded-lg border border-gray-500">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-white">VM {vmIndex + 1} Configuration</h4>
                    {vms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVM(vmIndex)}
                        className="p-2 hover:bg-red-600 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">VM Name</label>
                      <input
                        type="text"
                        value={vm.name}
                        onChange={(e) => handleVMChange(vmIndex, 'name', e.target.value)}
                        className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg
                                 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Connection Protocol</label>
                      <select
                        value={vm.protocol}
                        onChange={(e) => handleVMChange(vmIndex, 'protocol', e.target.value)}
                        className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg
                                 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      >
                        <option value="rdp">RDP (Remote Desktop Protocol)</option>
                        <option value="ssh">SSH (Secure Shell)</option>
                        <option value="vnc">VNC (Virtual Network Computing)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Step 2: Configure Users */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Number of Users</h3>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleUserCountChange(numberOfUsers - 1)}
                  className="p-2 bg-gray-600 border border-gray-500 rounded-l-lg text-white hover:bg-gray-700 transition-colors"
                  disabled={numberOfUsers <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={numberOfUsers}
                  onChange={(e) => handleUserCountChange(parseInt(e.target.value) || 1)}
                  className="w-20 px-4 py-2 bg-gray-600 border-y border-gray-500 text-center
                           text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleUserCountChange(numberOfUsers + 1)}
                  className="p-2 bg-gray-600 border border-gray-500 rounded-r-lg text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {users.map((user, userIndex) => (
                <div key={userIndex} className="p-6 bg-gray-600 rounded-lg border border-gray-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">User {userIndex + 1}</h3>
                    {users.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(userIndex)}
                        className="p-2 hover:bg-red-600 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* User Group Name Field */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <label className="block text-sm font-medium text-gray-300">User Group Name</label>
                    </div>
                    <input
                      type="text"
                      value={user.groupName}
                      onChange={(e) => handleUserGroupNameChange(userIndex, e.target.value)}
                      className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg
                               text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder={`User Group ${userIndex + 1}`}
                      required
                    />
                  </div>
                  
                  <div className="space-y-6">
                    {vms.map((vm) => {
                      const userVM = user.userVMs.find(uvm => uvm.vmId === vm.id) || {
                        vmId: vm.id,
                        username: '',
                        password: '',
                        ip: '',
                        port: vm.protocol === 'rdp' ? '3389' : vm.protocol === 'ssh' ? '22' : '5900'
                      };
                      
                      return (
                        <div key={vm.id} className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-center space-x-2 mb-4">
                            <Server className="h-5 w-5 text-blue-500" />
                            <h4 className="font-medium text-white">{vm.name} ({vm.protocol.toUpperCase()})</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                              <input
                                type="text"
                                value={userVM.username}
                                onChange={(e) => handleUserVMChange(userIndex, vm.id, 'username', e.target.value)}
                                className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg
                                         text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                              <input
                                type="text"
                                value={userVM.password}
                                onChange={(e) => handleUserVMChange(userIndex, vm.id, 'password', e.target.value)}
                                className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg
                                         text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">IP Address</label>
                              <input
                                type="text"
                                value={userVM.ip}
                                onChange={(e) => handleUserVMChange(userIndex, vm.id, 'ip', e.target.value)}
                                placeholder="e.g., 192.168.1.100"
                                className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg
                                         text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Port</label>
                              <input
                                type="text"
                                value={userVM.port}
                                onChange={(e) => handleUserVMChange(userIndex, vm.id, 'port', e.target.value)}
                                placeholder={vm.protocol === 'rdp' ? '3389' : vm.protocol === 'ssh' ? '22' : '5900'}
                                className="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg
                                         text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 text-base font-semibold rounded-lg
                     bg-gradient-to-r from-blue-600 to-purple-600
                     hover:from-blue-500 hover:to-purple-500
                     transform hover:scale-105 transition-all duration-300
                     text-white shadow-lg shadow-blue-500/20
                     min-w-[200px] focus:outline-none focus:ring-2 
                     focus:ring-blue-500/50 focus:ring-offset-2 
                     focus:ring-offset-white"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};