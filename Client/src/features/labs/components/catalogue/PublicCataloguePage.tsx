import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicCatalogueGrid } from './PublicCatalogueGrid';
import { PublicCatalogueFilters } from './PublicCatalogueFilters';
import { EditCourseModal } from './EditCourseModal';
import { GradientText } from '../../../../components/ui/GradientText';
import { useAuthStore } from '../../../../store/authStore';
import { Plus, BookOpen, Users, Award, TrendingUp, ShoppingCart, LogOut, LogIn, X, Edit } from 'lucide-react';
import axios from 'axios';
import { DeleteModal } from '../cloudvm/DeleteModal';

import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '../../../../store/useCartStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);


export const PublicCataloguePage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  // const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<any>(null);
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';
  const isOrgSuperAdmin = user?.role === 'orgsuperadmin';

  // Check if accessed from dashboard
  const isFromDashboard = location.pathname.includes('/dashboard/labs/catalogue');
  const {
      cartItems,
      isLoadingCart,
      fetchCartItems,
      removeFromCart,
      clearCart,
      updateCartItem,
      proceedToCheckout,
    } = useCartStore();

//   const fetchCartItems = async () => {
//     if (!isAuthenticated) return;

//     setIsLoadingCart(true);
//     try {
//       const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCartItems/${user?.id || currentUser?.id}`);
//       if (response.data.success) {
//         setCartItems(response.data.data.map((cart:any)=>({
//           ...cart,
//            defaultDuration: cart.duration}
//         )));
//       }
//     } catch (error) {
//       console.error('Error fetching cart items:', error);
//     } finally {
//       setIsLoadingCart(false);
//     }
//   };

//   const proceedToCheckout = useCallback(async () => {
//   if (cartItems.length === 0) return;

//   try {
//     const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/create-checkout-session`, {
//       userId: user?.id || currentUser?.id,
//       cartItems: cartItems.map(item => ({
//         lab_id: item.labid,
//         name: item.name,
//         quantity: item.quantity,
//         price: item.price,
//         duration: item.duration,
//         level: courses.find(course => course.id === item.labid)?.level,
//         category: courses.find(course => course.id === item.labid)?.category,
//         by: courses.find(course => course.id === item.labid)?.provider,
//       })),
//     });

//     const sessionId = response.data.sessionId;
//     const stripe = await stripePromise;
//     if (stripe) {
//       await stripe.redirectToCheckout({ sessionId });
//     }
//   } catch (error) {
//     console.error('Error during Stripe checkout:', error);
//     alert('Checkout failed. Please try again.');
//   }
// }, [cartItems, user, courses]);


  useEffect(() => {
    const fetchCatalogues = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API call
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabCatalogues` );
        setCourses(response.data.data);
        setFilteredCourses(response.data.data);
      } catch (error) {
        console.error('Error fetching catalogues:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCatalogues();

    if (isAuthenticated) {
      fetchCartItems(user?.id);
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
    
      if (isAuthenticated) {
        fetchCartItems(user?.id);
      }
    };

    const handleOpenCartModal = () => {
      setIsCartModalOpen(true);
    };

    // Listen for cart refresh events
    const handleCartRefresh = () => {
      if (isAuthenticated) {
        fetchCartItems(user?.id);
      }
    };

  

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('openCartModal', handleOpenCartModal);
    window.addEventListener('cartRefresh', handleCartRefresh);
    // window.addEventListener('checkout',proceedToCheckout)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('openCartModal', handleOpenCartModal);
      window.removeEventListener('cartRefresh', handleCartRefresh);
      // window.removeEventListener('checkout',proceedToCheckout)
    };
  }, [isAuthenticated]);

const handleUpdate = async (cartItemId: string, updates: { duration?: string; quantity?: number, defaultDuration?: number, price?: number }) => {
    try {
      const response = await updateCartItem(cartItemId,updates);
      if (response) {
        setEditingCartItem(null);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

    const handleCheckout = async () => {
  if (cartItems.length === 0) return;

  try {
    await proceedToCheckout(
      {userId: user?.id,
       catalogues:courses
      }
    );
  } catch (error) {
    console.error('Error during Stripe checkout:', error);
    alert('Checkout failed. Please try again.');
  }
};

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  // const removeFromCart = async (cartItemId: string) => {
  //   try {
  //     const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/removeFromCart/${cartItemId}`);
  //     if (response.data.success) {
  //       setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  //       // Trigger cart refresh for other components
  //       window.dispatchEvent(new CustomEvent('cartRefresh'));
  //     }
  //   } catch (error) {
  //     console.error('Error removing from cart:', error);
  //   }
  // };

  // const clearCart = async () => {
  //   try {
  //     const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/clearCart/${user?.id || currentUser?.id}`);
  //     if (response.data.success) {
  //       setCartItems([]);
  //       // Trigger cart refresh for other components
  //       window.dispatchEvent(new CustomEvent('cartRefresh'));
  //     }
  //   } catch (error) {
  //     console.error('Error clearing cart:', error);
  //   }
  // };

  // const updateCartItem = async (cartItemId: string, updates: { duration?: string; quantity?: number,defaultDuration?:number,price?:number }) => {
  //   try {
  //     const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateCartItem/${cartItemId}`, updates);
  //     if (response.data.success) {
  //       setCartItems(prev => prev.map(item => 
  //         item.id === cartItemId ? { ...item, ...updates } : item
  //       ));
  //       setEditingCartItem(null);
  //     }
  //   } catch (error) {
  //     console.error('Error updating cart item:', error);
  //   }
  // };




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

   if (filters.duration && filters.duration !== 'Any') {
  const durationFilter = filters.duration.trim().toLowerCase().replace(/\s+/g, '');

  filtered = filtered.filter(course => {
    const days = Number(course.duration);
    if (isNaN(days)) return false;

    if (durationFilter === '1week') {
      return days >= 1 && days <= 7;
    }

    if (durationFilter === '2weeks') {
      return days >= 8 && days <= 14;
    }

    if (durationFilter === '2+weeks' || durationFilter === '2weeks+') {
      return days >= 15;
    }

    if (durationFilter.includes('-')) {
      const [minStr, maxStr] = durationFilter.split('-');
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      return days >= min && days <= max;
    }

    // Exact match like "1", "2", etc.
    const exact = parseInt(durationFilter, 10);
    return days === exact;
  });
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
    try {
      setIsDeleting(true);
      const update = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/deleteLabCatalogue/${courseId}`);
      if (update.data.success) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
        setFilteredCourses(prev => prev.filter(course => course.id !== courseId));
      }
      else{

        console.error('Failed to delete course:', update.data.message);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
    finally{
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
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
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateLabCatalogue`, courseData);
        if (response.data.success) {
          setCourses(prev => prev.map(course => course.id === selectedCourse.id ? response.data.data : course));
          setFilteredCourses(prev => prev.map(course => course.id === selectedCourse.id ? response.data.data : course));
        }

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
if(isLoading) {
    return <div className="text-center text-gray-500">Loading courses...</div>;
  } 
  return (
    <div className={isFromDashboard ? "min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300" : "min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300"}>
      {/* Header with Auth and Cart - Always show when not from dashboard */}
      {!isFromDashboard && (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">
              <GradientText>Lab Catalogue</GradientText>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartModalOpen(true)}
              className="relative p-3 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 
                       hover:from-primary-500/30 hover:to-secondary-500/30
                       border border-primary-500/20 hover:border-primary-500/40 
                       rounded-xl transition-all duration-300 group"
            >
              <ShoppingCart className="h-6 w-6 text-primary-400 group-hover:text-primary-300" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary-500 to-secondary-500 
                               text-white text-xs rounded-full h-6 w-6 flex items-center justify-center 
                               font-semibold shadow-lg shadow-primary-500/20">
                  {cartItems.reduce((total, item) => total + Number(item.quantity), 0)}
                </span>
              )}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-gray-300 hidden sm:block">Welcome, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 
                           border border-red-500/20 hover:border-red-500/40 
                           rounded-lg transition-all duration-300 text-red-300 hover:text-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500
                         hover:from-primary-400 hover:to-secondary-400
                         rounded-lg transition-all duration-300 text-white font-semibold
                         shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
              >
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Hero Section - Only show when not from dashboard */}
      {!isFromDashboard && (
      <div className="relative py-16 text-center mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-2xl"></div>
        <div className="relative z-10">
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover and enroll in our comprehensive lab courses designed to enhance your skills
          </p>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className={`${isFromDashboard ? 'px-0' : 'container mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        
        {(isSuperAdmin || isOrgSuperAdmin) && (
          <div className={`flex justify-between items-center mb-8 ${isFromDashboard ? 'px-6' : ''}`}>
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
        <div className={isFromDashboard ? 'px-6' : ''}>
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
        </div>

        {/* Course Grid */}
        <div className={isFromDashboard ? 'px-6' : ''}>
          <PublicCatalogueGrid
            courses={filteredCourses}
            isLoading={isLoading}
            onEdit={(isSuperAdmin || isOrgSuperAdmin) ? handleEditCourse : undefined}
            onDelete={(isSuperAdmin || isOrgSuperAdmin) ? handleDeleteCourse : undefined}
            currentUser={user}
            isDeleting={isDeleting}
            isDeleteModalOpen={isDeleteModalOpen}
            cartItems={cartItems}
          />
        </div>
      </div>
      {/* Edit Course Modal */}
      <EditCourseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        course={selectedCourse}
        onSave={handleSaveCourse}
        isLoading={isSaving}
      />

      {/* Modern Cart Modal */}
      {isCartModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-dark-200 to-dark-300 rounded-2xl border border-primary-500/20 
                          max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-primary-500/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-primary-500/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">My Lab Cart</h2>
                  <p className="text-gray-400 text-sm">{Number(cartItems.length)} item{cartItems.length !== 1 ? 's' : ''} selected</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartModalOpen(false)}
                className="p-2 hover:bg-dark-400/50 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoadingCart ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading cart...</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500">Add some labs to get started!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="p-4 bg-dark-400/30 rounded-xl border border-primary-500/10 
                                                   hover:border-primary-500/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{item.name || item.title}</h4>
                          <p className="text-sm text-gray-400 line-clamp-2">{item.lab_description || item.description}</p>

                          {editingCartItem?.id === item.id ? (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Duration (days)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    defaultValue={item.duration}
                                    onChange={(e) => setEditingCartItem({...editingCartItem, duration: e.target.value})}
                                    className="w-full px-3 py-2 bg-dark-500/50 border border-gray-500/20 rounded-lg 
                                             text-white text-sm focus:border-primary-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                                  <input
                                    type="number"
                                    min="1"
                                    defaultValue={item.quantity}
                                    onChange={(e) => setEditingCartItem({...editingCartItem, quantity: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 bg-dark-500/50 border border-gray-500/20 rounded-lg 
                                             text-white text-sm focus:border-primary-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUpdate(item.id, {
                                    duration: editingCartItem.duration || item.duration,
                                    quantity: editingCartItem.quantity || item.quantity,
                                    defaultDuration : item.defaultduration || 1,
                                    price:item.defaultprice
                                  })}
                                  className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 
                                           rounded text-sm transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCartItem(null)}
                                  className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 
                                           rounded text-sm transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-primary-400">{item.lab_category || item.category}</span>
                              <span className="text-xs text-gray-500">{item.duration} days</span>
                              <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                              
                                    <span className="font-semibold text-white">
                                      ₹{item.price}
                                    </span>

                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {editingCartItem?.id !== item.id && (
                            <button
                              onClick={() => setEditingCartItem(item)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 
                                       rounded-lg transition-colors"
                              title="Edit item"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 
                                     rounded-lg transition-colors"
                            title="Remove from cart"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {cartItems.length > 0 && !isLoadingCart && (
              <div className="p-6 border-t border-primary-500/20 bg-dark-400/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                   <span className="text-lg font-semibold text-white">
                    Total: ₹{cartItems.reduce((total, item) => {
                      return total + Number(item.price);
                    }, 0).toFixed(2)}
                  </span>

                    <p className="text-sm text-gray-400">
                      {cartItems.reduce((total, item) => total + Number(item.quantity), 0)} item(s)
                    </p>
                  </div>
                  <button
                    onClick={()=>clearCart(user?.id)}
                    className="text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Clear Cart
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsCartModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-dark-400/50 hover:bg-dark-400/70 
                             border border-gray-500/20 hover:border-gray-500/40 
                             rounded-lg transition-all duration-300 text-gray-300 hover:text-white"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500
                             hover:from-primary-400 hover:to-secondary-400
                             rounded-lg transition-all duration-300 text-white font-semibold
                             shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};