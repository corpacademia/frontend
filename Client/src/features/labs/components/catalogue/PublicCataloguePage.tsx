
import React, { useState, useEffect } from 'react';
import { PublicCatalogueFilters } from './PublicCatalogueFilters';
import { PublicCatalogueGrid } from './PublicCatalogueGrid';
import { EditCourseModal } from './EditCourseModal';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { Plus, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import axios from 'axios';

// Mock data for demonstration - replace with actual API calls
const mockCourses = [
  {
    id: '1',
    title: 'Administering Windows Server Hybrid Core Infrastructure',
    description: 'Learn to administer and manage Windows Server hybrid environments with hands-on labs and real-world scenarios.',
    provider: 'Microsoft',
    duration: '4 days',
    level: 'Intermediate',
    category: 'Cloud Computing',
    rating: 4.5,
    enrolledCount: 1234,
    price: 299,
    isFree: false
  },
  {
    id: '2',
    title: 'AIOps Foundation Certification',
    description: 'Master the fundamentals of AIOps and learn how to implement intelligent operations in your organization.',
    provider: 'DevOps Institute',
    duration: '2 days',
    level: 'Intermediate',
    category: 'DevOps',
    rating: 4.3,
    enrolledCount: 856,
    price: 199,
    isFree: false
  },
  {
    id: '3',
    title: 'Ansible Training',
    description: 'Comprehensive Ansible training covering automation, configuration management, and orchestration.',
    provider: 'Learning Tree',
    duration: '2 days',
    level: 'Foundation',
    category: 'DevOps',
    rating: 4.7,
    enrolledCount: 2341,
    price: 0,
    isFree: true
  },
  {
    id: '4',
    title: 'Automating Administration with PowerShell',
    description: 'Learn to automate Windows administration tasks using PowerShell scripting and best practices.',
    provider: 'Microsoft',
    duration: '5 days',
    level: 'Intermediate',
    category: 'Development',
    rating: 4.6,
    enrolledCount: 987,
    price: 399,
    isFree: false
  },
  {
    id: '5',
    title: 'Azure DevOps Engineer',
    description: 'Become proficient in Azure DevOps services for CI/CD, infrastructure as code, and project management.',
    provider: 'Microsoft',
    duration: '3 days',
    level: 'Intermediate',
    category: 'Cloud Computing',
    rating: 4.8,
    enrolledCount: 1567,
    price: 349,
    isFree: false
  },
  {
    id: '6',
    title: 'Certified Agile Service Manager',
    description: 'Learn agile service management principles and practices for modern IT organizations.',
    provider: 'DevOps Institute',
    duration: '2 days',
    level: 'Intermediate',
    category: 'Management',
    rating: 4.4,
    enrolledCount: 743,
    price: 249,
    isFree: false
  }
];

export const PublicCataloguePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState(mockCourses);
  const [filteredCourses, setFilteredCourses] = useState(mockCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    level: '',
    duration: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

  // Filter courses based on current filters
  useEffect(() => {
    let filtered = courses;

    if (filters.search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(course => course.category === filters.category);
    }

    if (filters.brand) {
      filtered = filtered.filter(course => course.provider === filters.brand);
    }

    if (filters.level) {
      filtered = filtered.filter(course => course.level === filters.level);
    }

    if (filters.duration) {
      // Simple duration matching - you might want to make this more sophisticated
      filtered = filtered.filter(course => course.duration.includes(filters.duration.split('-')[0]));
    }

    setFilteredCourses(filtered);
  }, [filters, courses]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setIsEditModalOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      setCourses(prev => prev.filter(course => course.id !== courseId));
    }
  };

  const handleAddNewCourse = () => {
    setSelectedCourse(null);
    setIsEditModalOpen(true);
  };

  const handleSaveCourse = async (courseData: any) => {
    setIsSaving(true);
    try {
      if (selectedCourse) {
        // Update existing course
        setCourses(prev => prev.map(course =>
          course.id === selectedCourse.id ? { ...courseData, id: selectedCourse.id } : course
        ));
      } else {
        // Add new course
        const newCourse = { ...courseData, id: Date.now().toString() };
        setCourses(prev => [...prev, newCourse]);
      }
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const stats = {
    totalCourses: courses.length,
    totalStudents: courses.reduce((sum, course) => sum + course.enrolledCount, 0),
    averageRating: (courses.reduce((sum, course) => sum + course.rating, 0) / courses.length).toFixed(1),
    freeCourses: courses.filter(course => course.isFree).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border-b border-primary-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2523ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <GradientText>Lab Catalogue</GradientText>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover our comprehensive collection of professional training labs and certifications. 
              Master new skills with expert-led training and hands-on labs.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-6 w-6 text-primary-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.totalCourses}</span>
                </div>
                <p className="text-sm text-gray-400">Labs</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-primary-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.totalStudents.toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-400">Candidates</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-primary-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.averageRating}</span>
                </div>
                <p className="text-sm text-gray-400">Avg Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-primary-400 mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.freeCourses}</span>
                </div>
                <p className="text-sm text-gray-400">Free Labs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Controls */}
        {isSuperAdmin && (
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Manage Labs</h2>
            <button
              onClick={handleAddNewCourse}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Lab</span>
            </button>
          </div>
        )}

        {/* Filters */}
        <PublicCatalogueFilters
          onFilterChange={handleFilterChange}
          filters={filters}
        />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredCourses.length} of {courses.length} Labs
          </p>
        </div>

        {/* Course Grid */}
        <PublicCatalogueGrid
          courses={filteredCourses}
          isLoading={isLoading}
          onEdit={isSuperAdmin ? handleEditCourse : undefined}
          onDelete={isSuperAdmin ? handleDeleteCourse : undefined}
        />
      </div>

      {/* Edit Course Modal */}
      <EditCourseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        course={selectedCourse}
        onSave={handleSaveCourse}
        isLoading={isSaving}
      />
    </div>
  );
};
