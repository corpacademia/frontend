import React, { useState } from "react";
import { Search, Calendar } from "lucide-react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface OrgFilterUpdate {
  key: string;
  value: string;
}

interface OrganizationFiltersProps {
  onFilterChange: (update: OrgFilterUpdate) => void;
  setFilters: (filters: { [key: string]: string }) => void;
  filters: { [key: string]: string };
}

export const OrganizationFilters: React.FC<OrganizationFiltersProps> = ({
  onFilterChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const handleInputChange = (key: string, value: string) => {
    onFilterChange({ key, value });
  };

  const handleDateChange = (ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    setDateRange([ranges.selection]);

    // Format to YYYY-MM-DD before sending to filters
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    onFilterChange({ key: "startDate", value: start });
    onFilterChange({ key: "endDate", value: end });
  };

  return (
    <div className="bg-dark-300/30 backdrop-blur-sm border border-primary-500/10 rounded-lg p-3 sm:p-4 relative">
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search organizations..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 placeholder-gray-500 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors text-xs sm:text-sm"
            onChange={(e) => handleInputChange("search", e.target.value)}
          />
          <Search className="absolute left-2.5 sm:left-3 top-2.5 h-4 w-4 text-gray-500" />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <select
            className="px-2 sm:px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors text-xs sm:text-sm"
            onChange={(e) => handleInputChange("type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="training">Training</option>
            <option value="enterprise">Enterprise</option>
            <option value="education">Education</option>
          </select>

          <select
            className="px-2 sm:px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors text-xs sm:text-sm"
            onChange={(e) => handleInputChange("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            className="px-2 sm:px-3 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg 
                     text-gray-300 focus:border-primary-500/40 focus:outline-none 
                     focus:ring-2 focus:ring-primary-500/20 transition-colors text-xs sm:text-sm"
            onChange={(e) => handleInputChange("subscriptionTier", e.target.value)}
          >
            <option value="">All Tiers</option>
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Date Range Picker */}
          <div className="relative">
            <button
              type="button"
              className="btn-secondary flex items-center justify-center text-xs sm:text-sm py-2 w-full"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-gray-200" />
              <span>Date Range</span>
            </button>

            {showDatePicker && (
              <div className="absolute z-50 mt-2 right-0">
                <DateRange
                  ranges={dateRange}
                  onChange={handleDateChange}
                  moveRangeOnFirstSelection={false}
                  rangeColors={["#2563eb"]}
                  maxDate={new Date()}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
