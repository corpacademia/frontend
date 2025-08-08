
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  BookOpen, 
  Star, 
  Calendar,
  Play,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { DeleteModal } from '../cloudvm/DeleteModal';

interface PublicCatalogueCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    provider: string;
    duration: string;
    level: string;
    category: string;
    rating: number;
    enrolledCount: number;
    image?: string;
    price?: number;
    isfree?: boolean;
    admin_id?: string;
    user_id?: string;
  };
  onEdit?: (course: any) => void;
  onDelete?: (courseId: string) => void;
  onView?: (course: any) => void;
  currentUser?: any;
  isDeleting?: boolean;
  isDeleteModalOpen?: boolean;
  cartItems?:any;
}

export const PublicCatalogueCard: React.FC<PublicCatalogueCardProps> = ({ 
  course, 
  onEdit, 
  onDelete, 
  onView,
  currentUser,
  isDeleting = false,
  isDeleteModalOpen = false,
  cartItems
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isDeleteModalOpenn, setIsDeleteModalOpen] = useState(false);
  
  const isSuperAdmin = (currentUser || user)?.role === 'superadmin';
  const isOrgSuperAdmin = (currentUser || user)?.role === 'orgsuperadmin';
  
  // Check if current user can edit/delete this lab
  const canEditDelete = () => {
    if (isSuperAdmin) return true;
    if (isOrgSuperAdmin && (course.admin_id === (currentUser || user)?.id || course?.user_id === (currentUser || user)?.id)) return true;
    return false;
  };

 const checkCartExist = (labid: string): boolean => {
  return !!cartItems.find((course: any) => course.labid === labid);
};

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'foundation':
        return 'bg-green-500/20 text-green-300';
      case 'beginner':
        return 'bg-blue-500/20 text-blue-300';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced':
        return 'bg-red-500/20 text-red-300';
      case 'expert':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // Redirect to login/signup
      window.location.href = '/login';
    } else {
      try {
        // Add to cart via backend API
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/addToCart`, {
          labId: course.id, 
          name: course.title, 
          description: course.description, 
          duration: course.duration, 
          price: course.price || 0, 
          quantity: 1, 
          userId: user?.id || currentUser?.id
        });
        
        if (response.data.success) {
          setIsInCart(true);
          // Trigger cart update in parent component
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  const handleGoToCart = () => {
    // Just trigger the cart modal to open
    window.dispatchEvent(new CustomEvent('openCartModal'));
  };

  return (
    <>
    <div 
      className="relative group bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-sm 
                 rounded-xl border border-red-500/20 hover:border-red-400/40 
                 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 
                 hover:translate-y-[-4px] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2523ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

      {/* Admin Controls - For SuperAdmin and Lab Creators */}
      {canEditDelete() && onEdit && onDelete && (
        <div className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-300 z-10 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => onEdit(course)}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
            title="Edit Lab"
          >
            <Edit className="h-4 w-4 text-blue-300" />
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true) }
            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            title="Delete Lab"
          >
            <Trash2 className="h-4 w-4 text-red-300" />
          </button>
        </div>
      )}
     
      <div className="relative p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
              {course.level}
            </span>
          </div>
          <div className="flex items-center text-amber-400">
            <Star className="h-4 w-4 mr-1 fill-current" />
            <span className="text-sm font-medium">{course.rating}</span>
          </div>
        </div>

        {/* Course Title */}
        <h3 className="text-xl font-bold mb-3 line-clamp-2 min-h-[3.5rem]">
          <GradientText>{course.title}</GradientText>
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
          {course.description}
        </p>

        {/* Course Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-primary-400" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <User className="h-4 w-4 mr-2 text-primary-400" />
            <span>by {course.provider}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <BookOpen className="h-4 w-4 mr-2 text-primary-400" />
            <span>{course.enrolledCount} enrolled</span>
          </div>
          <div className="flex items-center text-gray-400">
            <Calendar className="h-4 w-4 mr-2 text-primary-400" />
            <span>{course.category}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-red-500/20">
          <div>
            {course.isfree ? (
              <span className="text-green-400 font-semibold">Free</span>
            ) : (
              <span className="text-white font-semibold">${course.price}</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {onView && (
              <button
                onClick={() => onView(course)}
                className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-white
                         rounded-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View</span>
              </button>
            )}
            
            {!isInCart && !checkCartExist(course.id) ? (
              <button
                onClick={handleAddToCart}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500
                         hover:from-primary-400 hover:to-secondary-400
                         text-white rounded-lg transition-all duration-300
                         flex items-center space-x-2 shadow-lg shadow-primary-500/20"
              >
                <Play className="h-4 w-4" />
                <span>{isAuthenticated  ? 'Add to Cart' : 'Login to Add'}</span>
              </button>
            ) : (
              <button
                onClick={handleGoToCart}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500
                         hover:from-emerald-400 hover:to-green-400
                         text-white rounded-lg transition-all duration-300
                         flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
              >
                <Play className="h-4 w-4" />
                <span>Go to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
             {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpenn}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete ? () => onDelete(course.id) : undefined}
        isDeleting={isDeleting}
      />
    </>
  );
};
