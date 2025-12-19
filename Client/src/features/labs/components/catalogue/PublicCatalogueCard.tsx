import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  User, 
  BookOpen, 
  Star, 
  Calendar,
  Play,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Building2,
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import axios from 'axios';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { DeleteModal } from '../cloudvm/DeleteModal';
import { useLabDetailsStore } from '../../../../store/labDetailsStore';

interface PublicCatalogueCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    provider: string;
    duration: string;
    level: string;
    category: string;
    avg_rating: number;
    enrolledCount: number;
    image?: string;
    price?: number;
    isfree?: boolean;
    admin_id?: string;
    user_id?: string;
    software?: string; // "available" | "not available"
    type?: string;
    total_enrollments?: number;
  };
  onEdit?: (course: any) => void;
  onDelete?: (courseId: string) => void;
  onView?: (course: any) => void;
  currentUser?: any;
  isDeleting?: boolean;
  isDeleteModalOpen?: boolean;
  cartItems?: any;
  enrolled?: boolean;
}

export const PublicCatalogueCard: React.FC<PublicCatalogueCardProps> = ({ 
  course, 
  onEdit, 
  onDelete, 
  onView,
  currentUser,
  isDeleting = false,
  cartItems,
  enrolled
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isDeleteModalOpenn, setIsDeleteModalOpen] = useState(false);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const isSuperAdmin = (currentUser || user)?.role === 'superadmin';
  const isOrgSuperAdmin = (currentUser || user)?.role === 'orgsuperadmin';
  const isOrgLabAdmin =(currentUser || user)?.role === 'labadmin';
  const isAvailable = (course.software || '').toLowerCase() === 'available';
  
  const [isOrgAssignModalOpen, setIsOrgAssignModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
 
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isSuperAdmin) return;
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/organizations`);
        if (response.data.success) {
          setOrganizations(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    fetchOrganizations();
  }, [isSuperAdmin]);

  const canEditDelete = () => {
    if (isSuperAdmin) return true;
    if (
      isOrgSuperAdmin && 
      ( course?.user_id === (currentUser || user)?.id)
    ) return true;
    else if(isOrgLabAdmin && 
      ( course?.user_id === (currentUser || user)?.id)) return true;
    return false;
  };
  const checkCartExist = (labid: string): boolean => {
    return !!cartItems?.find((c: any) => c.labid === labid);
  };

  const getLevelColor = (level: string) => {
    if (!level) return 'bg-gray-500/20 text-gray-300';
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
      window.location.href = '/login';
      return;
    }
    try {
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
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setLoadingEnroll(true);
    setEnrollMessage(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/enroll`,
        {
          labId: course.id,
          userId: user?.id || currentUser?.id,
          duration: course.duration,
          labType: course.type,
          userName:user?.name
        }
      );

      if (response.data.success) {
        window.dispatchEvent(new CustomEvent('labsUpdated'));
        setEnrollMessage({ type: 'success', text: 'Successfully enrolled!' });

        setTimeout(() => {
          navigate(`/dashboard/my-labs/`, {
            state: { labDetails: course },
          });
        }, 1000);
      } else {
        setEnrollMessage({ type: 'error', text: response.data.message || 'Enrollment failed.' });
      }
    } catch (error: any) {
      setEnrollMessage({ type: 'error', text: error.response?.data?.message || 'Something went wrong!' });
      console.error('Error enrolling to course:', error);
    } finally {
      setLoadingEnroll(false);
    }
  };

  const handleGoToCart = () => {
    window.dispatchEvent(new CustomEvent('openCartModal'));
  };

  const handleOrgAssignment = async () => {
    if (!selectedOrg) {
      setAssignError('Please select an organization');
      setTimeout(() => setAssignError(null), 2000);
      return;
    }

    setIsAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      let org_details = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/organization_ms/getOrgDetails`, {
        org_id: selectedOrg
      });

      if (!org_details.data.success) {
        throw new Error('Failed to fetch organization details');
      }

      let response;
      
      if (course.type === 'cloudslice') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/cloud_slice_ms/cloudSliceOrgAssignment`, {
          sliceId: course.id,
          organizationId: selectedOrg,
          userId: (currentUser || user)?.id,
          startDate: new Date().toISOString(),
          endDate: course.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (course.type === 'singlevm') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/singleVMDatacenterLabOrgAssignment`, {
          labId: course.id,
          orgId: selectedOrg,
          assignedBy: (currentUser || user)?.id,
          startDate: new Date().toISOString(),
          endDate: course.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (course.type === 'vmcluster') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/vmcluster_ms/assignToOrganization`, {
          labId: course.id,
          orgId: selectedOrg,
          assignedBy: (currentUser || user)?.id,
          startDate: new Date().toISOString(),
          endDate: course.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (course.type === 'singlevm-proxmox') {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/assignLabToOrg`, {
          labId: course.id,
          orgId: selectedOrg,
          startDate: new Date().toISOString(),
          endDate: course.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_by: (currentUser || user)?.id,
          user_id: org_details.data.data.org_admin,
          userName: organizations.find(o => o.id === selectedOrg)?.organization_name || ''
        });
      } else {
        response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/batchAssignment`, {
          lab_id: course.id,
          admin_id: org_details.data.data.org_admin,
          org_id: selectedOrg,
          configured_by: (currentUser || user)?.id,
          enddate: course.expiresIn || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      if (response?.data?.success) {
        setAssignSuccess('Successfully assigned to organization');
        setTimeout(() => {
          setIsOrgAssignModalOpen(false);
          setSelectedOrg('');
          setAssignSuccess(null);
        }, 2000);
      } else {
        throw new Error(response?.data?.message || 'Failed to assign to organization');
      }
    } catch (error: any) {
      setAssignError(error.response?.data?.message || error.message || 'Failed to assign to organization');
      setTimeout(() => setAssignError(null), 2000);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    navigate(`/dashboard/labs/details/${course.id}`, { 
      state: { 
        labType: course?.type,
        labDetails: course 
      } 
    });
  };

  return (
    <>
      <div 
        className="relative group bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-sm 
                   rounded-xl border border-red-500/20 hover:border-red-400/40 
                   transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 
                   hover:translate-y-[-4px] overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Admin Controls */}
        {canEditDelete() && onEdit && onDelete && (
          <div className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-300 z-10 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {isSuperAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOrgAssignModalOpen(true);
                }}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                title="Assign to Organization"
              >
                <Building2 className="h-4 w-4 text-green-300" />
              </button>
            )}
            <button
              onClick={() => onEdit(course)}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
              title="Edit Lab"
            >
              <Edit className="h-4 w-4 text-blue-300" />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
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
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course?.level)}`}>
                {course.level}
              </span>
            </div>
            <div className="flex items-center text-amber-400">
              <Star className="h-4 w-4 mr-1 fill-current" />
              <span className="text-sm font-medium">{Number(course.avg_rating)}</span>
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
              <span>{course.duration} {course?.duration === "1" ? 'day' : 'days'}</span>
            </div>
            <div className="flex items-center text-gray-400">
              <User className="h-4 w-4 mr-2 text-primary-400" />
              <span>by {course.provider}</span>
            </div>
            <div className="flex items-center text-gray-400">
              <BookOpen className="h-4 w-4 mr-2 text-primary-400" />
              <span>{course.total_enrollments} enrolled</span>
            </div>
            <div className="flex items-center text-gray-400">
              <Calendar className="h-4 w-4 mr-2 text-primary-400" />
              <span>{course.category}</span>
            </div>
            <div className="flex items-center text-gray-400 col-span-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isAvailable
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {isAvailable ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex flex-col space-y-2 mt-auto pt-4 border-t border-red-500/20">
            <div className="flex items-center justify-between">
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

                {enrolled ? (
                  <button
                    onClick={() =>
                      navigate(`/dashboard/labs/details/${course.id}`, {
                        state: { labDetails: course ,labType:course.type},
                      })
                    }
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500
                               hover:from-emerald-400 hover:to-green-400
                               text-white rounded-lg transition-all duration-300
                               flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Play className="h-4 w-4" />
                    <span>Go to Lab</span>
                  </button>
                ) : course.isfree ? (
                  <button
                    onClick={handleEnroll}
                    disabled={loadingEnroll}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500
                             hover:from-indigo-400 hover:to-purple-400
                             text-white rounded-lg transition-all duration-300
                             flex items-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {loadingEnroll ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span>{isAuthenticated ? 'Enroll Now' : 'Login to Enroll'}</span>
                  </button>
                ) : (
                  <>
                    {!isAvailable ? (
                      <button
                        disabled
                        title="Not available"
                        className="px-4 py-2 bg-gray-500/30 text-gray-400 
                                 rounded-lg transition-all duration-300 
                                 flex items-center space-x-2 cursor-not-allowed"
                      >
                        <Play className="h-4 w-4" />
                        <span>Not Available</span>
                      </button>
                    ) : !isInCart && !checkCartExist(course.id) ? (
                      <button
                        onClick={handleAddToCart}
                        className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500
                                 hover:from-primary-400 hover:to-secondary-400
                                 text-white rounded-lg transition-all duration-300
                                 flex items-center space-x-2 shadow-lg shadow-primary-500/20"
                      >
                        <Play className="h-4 w-4" />
                        <span>{isAuthenticated ? 'Add to Cart' : 'Login to Add'}</span>
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
                  </>
                )}
              </div>
            </div>

            {enrollMessage && (
              <div
                className={`text-sm font-medium px-3 py-2 rounded-lg ${
                  enrollMessage.type === 'success'
                    ? 'text-green-300 bg-green-500/20'
                    : 'text-red-300 bg-red-500/20'
                }`}
              >
                {enrollMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpenn}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete ? () => onDelete(course.id) : undefined}
        isDeleting={isDeleting}
      />

      {isOrgAssignModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOrgAssignModalOpen(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-dark-200 rounded-lg w-full max-w-md p-6 z-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  <GradientText>Assign to Organization</GradientText>
                </h2>
                <button
                  onClick={() => setIsOrgAssignModalOpen(false)}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organization
                  </label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-400/50 border border-primary-500/20 rounded-lg
                           text-gray-300 focus:border-primary-500/40 focus:outline-none"
                  >
                    <option value="">Select an organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.organization_name}
                      </option>
                    ))}
                  </select>
                </div>

                {assignError && (
                  <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <span className="text-red-200">{assignError}</span>
                    </div>
                  </div>
                )}

                {assignSuccess && (
                  <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-emerald-400" />
                      <span className="text-emerald-200">{assignSuccess}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOrgAssignModalOpen(false)}
                    className="btn-secondary"
                    disabled={isAssigning}
                  >
                    <GradientText>
                      Cancel
                    </GradientText>
                  </button>
                  <button
                    onClick={handleOrgAssignment}
                    disabled={isAssigning}
                    className="btn-primary"
                  >
                    <GradientText>
                      {isAssigning ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Assigning...
                        </span>
                      ) : (
                        'Assign'
                      )}
                    </GradientText>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
