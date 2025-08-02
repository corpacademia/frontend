import React from 'react';
import { PublicCatalogueCard } from './PublicCatalogueCard';
import { Loader } from 'lucide-react';

interface PublicCatalogueGridProps {
  courses: any[];
  isLoading?: boolean;
  onEdit?: (course: any) => void;
  onDelete?: (courseId: string) => void;
  onView?: (course: any) => void;
  currentUser?: any;
  isDeleteModalOpen?: boolean;
  isDeleting?: boolean;
  cartItems?:any;
}

export const PublicCatalogueGrid: React.FC<PublicCatalogueGridProps> = ({ 
  courses, 
  isLoading, 
  onEdit, 
  onDelete, 
  onView,
  currentUser,
  isDeleting = false,
  isDeleteModalOpen = false,
  cartItems
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">No courses found</h3>
        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map(course => (
        <PublicCatalogueCard 
          key={course.id} 
          course={course}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          currentUser={currentUser}
          isDeleting={isDeleting}
          isDeleteModalOpen={isDeleteModalOpen}
          cartItems={cartItems}
        />
      ))}
    </div>
  );
};