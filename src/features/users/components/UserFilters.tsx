import React, { useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

interface UserFilterUpdate {
  key: string;
  value: string;
}

interface UserFiltersProps {
  onFilterChange: (update: UserFilterUpdate) => void;
  setFilters: (filters: { [key: string]: string }) => void;
  filters: { [key: string]: string };
}

export const UserFilters: React.FC<UserFiltersProps> = ({ 
  onFilterChange,
  filters,
  setFilters 
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const handleInputChange = (key: string, value: string) => {
    onFilterChange({ key, value });
  };

  const handleDateSubmit = () => {
    if (dateRange.startDate && dateRange.endDate) {
      handleInputChange('dateRange', `${dateRange.startDate},${dateRange.endDate}`);
      setShowDatePicker(false);
    }
  };

  return (
    <div className="glass-panel mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
            onChange={(e) => handleInputChange('search', e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
            onChange={(e) => handleInputChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="trainer">Trainer</option>
            <option value="orgadmin">Organization Admin</option>
          </select>

          <select
            className="px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors"
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          <div className="relative">
            <button 
              className="btn-secondary"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </button>

            {showDatePicker && (
              <div className="absolute top-full mt-2 right-0 bg-dark-200 rounded-lg p-4 shadow-lg border border-primary-500/20 z-50">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                               text-gray-300 focus:border-primary-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => setShowDatePicker(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDateSubmit}
                      className="btn-primary text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            className="btn-secondary"
            onClick={() => {
              setFilters({
                search: '',
                role: '',
                status: '',
                dateRange: ''
              });
              setDateRange({ startDate: '', endDate: '' });
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};