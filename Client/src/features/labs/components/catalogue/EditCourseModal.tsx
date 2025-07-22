
import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { GradientText } from '../../../../components/ui/GradientText';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: any;
  onSave: (courseData: any) => void;
  isLoading?: boolean;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    provider: '',
    duration: '',
    level: 'Foundation',
    category: '',
    price: 0,
    isFree: false,
    rating: 4.5,
    enrolledCount: 0
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        provider: course.provider || '',
        duration: course.duration || '',
        level: course.level || 'Foundation',
        category: course.category || '',
        price: course.price || 0,
        isFree: course.isFree || false,
        rating: course.rating || 4.5,
        enrolledCount: course.enrolledCount || 0
      });
    }
  }, [course]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : type === 'number' ? parseFloat(value) || 0 
              : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...course, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl border border-primary-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              <GradientText>{course ? 'Edit Course' : 'Add New Course'}</GradientText>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-dark-300/50 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Provider *
                </label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                         text-gray-300 focus:border-primary-500/40 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 4 days"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={formData.isFree}
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enrolled Count
                </label>
                <input
                  type="number"
                  name="enrolledCount"
                  value={formData.enrolledCount}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFree"
                id="isFree"
                checked={formData.isFree}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500/20 border-gray-300 rounded"
              />
              <label htmlFor="isFree" className="ml-2 text-sm text-gray-300">
                This course is free
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-primary-500/20">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500
                         hover:from-primary-400 hover:to-secondary-400 text-white rounded-lg
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{course ? 'Update Course' : 'Create Course'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
