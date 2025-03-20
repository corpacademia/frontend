import React, { useState, useEffect } from 'react';
import { GradientText } from '../../../components/ui/GradientText';
import { Plus } from 'lucide-react';
import { AssessmentList } from '../components/assessment/AssessmentList';
import { AssessmentFilters } from '../components/assessment/AssessmentFilters';
import { AddAssessmentModal } from '../components/assessment/AddAssessmentModal';
import axios from 'axios';

export const Assessments: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: ''
  });

  const fetchAssessments = async () => {
    try {
      const response = await axios.get('/api/assessments');
      setAssessments([]);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleFilterChange = (update: { key: string; value: string }) => {
    setFilters(prev => ({ ...prev, [update.key]: update.value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <GradientText>Assessments</GradientText>
          </h1>
          <p className="mt-2 text-gray-400">
            Manage and monitor assessment environments
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </button>
      </div>

      <AssessmentFilters 
        onFilterChange={handleFilterChange}
        filters={filters}
        setFilters={setFilters}
      />

      <AssessmentList 
        assessments={assessments}
        isLoading={isLoading}
      />

      <AddAssessmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchAssessments}
      />
    </div>
  );
};