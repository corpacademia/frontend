import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Bell, Settings, LogOut, User, ChevronDown, ShoppingCart, X, Edit } from 'lucide-react';
import { GradientText } from '../../../components/ui/GradientText';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { useCatalogueStore } from '../../../store/catalogueStore';
import { useCartStore } from '../../../store/useCartStore';

export const DashboardHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  // const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  // const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { catalogues, isLoading, error, fetchAllCatalogues } = useCatalogueStore();
  const {
    cartItems,
    isLoadingCart,
    fetchCartItems,
    removeFromCart,
    clearCart,
    updateCartItem,
    proceedToCheckout,
  } = useCartStore();
  

  useEffect(() => {
    fetchAllCatalogues();
  }, []);
  // useEffect(()=>{
  //    const fetchCatalogues = async () => {
  //         try {
  //           // Replace with actual API call
  //           const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getAllLabCatalogues` );
  //           setCourses(response.data.data);
  //         } catch (error) {
  //           console.error('Error fetching catalogues:', error);
  //         } 
  //       }
  //       fetchCatalogues();
    
  // })
  // const fetchCartItems = async () => {
  //   if (!isAuthenticated) return;

  //   setIsLoadingCart(true);
  //   try {
  //     const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCartItems/${user?.id}`);
  //     if (response.data.success) {
  //       setCartItems(response.data.data.map((cart: any) => ({
  //         ...cart,
  //         defaultDuration: cart.duration
  //       })));
  //     }
  //   } catch (error) {
  //     console.error('Error fetching cart items:', error);
  //   } finally {
  //     setIsLoadingCart(false);
  //   }
  // };

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
  //     const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/clearCart/${user?.id}`);
  //     if (response.data.success) {
  //       setCartItems([]);
  //       // Trigger cart refresh for other components
  //       window.dispatchEvent(new CustomEvent('cartRefresh'));
  //     }
  //   } catch (error) {
  //     console.error('Error clearing cart:', error);
  //   }
  // };

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
      catalogues
      }
    );
  } catch (error) {
    console.error('Error during Stripe checkout:', error);
    alert('Checkout failed. Please try again.');
  }
};


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     fetchCartItems();
  //   }

  //   // Listen for cart updates
  //   const handleCartUpdate = () => {
  //     if (isAuthenticated) {
  //       fetchCartItems();
  //     }
  //   };

  //   // Listen for cart refresh events
  //   const handleCartRefresh = () => {
  //     if (isAuthenticated) {
  //       fetchCartItems();
  //     }
  //   };

  //   window.addEventListener('cartUpdated', handleCartUpdate);
  //   window.addEventListener('cartRefresh', handleCartRefresh);

  //   return () => {
  //     window.removeEventListener('cartUpdated', handleCartUpdate);
  //     window.removeEventListener('cartRefresh', handleCartRefresh);
  //   };
  // }, [isAuthenticated]);

  useEffect(() => {
  if (user?.id && catalogues.length > 0) {
    fetchCartItems(user.id);
  }
}, [user?.id, catalogues.length]);


  const handleLogout = () => {
    setIsSettingsDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setIsSettingsDropdownOpen(false);
    navigate('/profile');
  };

  // Extract filename from path
  const extractFileName = (filePath: string) => {
    const match = filePath.match(/[^\\\/]+$/);
    return match ? match[0] : null;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-dark-200 border-b border-dark-300 h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-lg sm:text-xl font-bold">
            <GradientText>Dashboard</GradientText>
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:block">
            <OrganizationSwitcher />
          </div>
          
          {/* Cart Button */}
          <button
            onClick={() => setIsCartModalOpen(true)}
            className="relative p-2 text-gray-400 hover:text-primary-300 rounded-lg hover:bg-dark-100/50 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary-500 to-secondary-500 
                             text-white text-xs rounded-full h-5 w-5 flex items-center justify-center 
                             font-semibold shadow-lg shadow-primary-500/20">
                {cartItems.reduce((total, item) => total + Number(item.quantity), 0)}
              </span>
            )}
          </button>
          
          <button className="p-2 text-gray-400 hover:text-primary-300 rounded-lg hover:bg-dark-100/50 transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center hover:from-primary-400 hover:to-secondary-400 transition-all duration-200 transform hover:scale-105"
              title="Profile & Settings"
            >
              {user?.profilephoto ? (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/uploads/${extractFileName(user.profilephoto)}`}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {user?.name ? `${user.name.charAt(0)}${user.name.split(' ').pop()?.charAt(0) || ''}` : 'U'}
                </span>
              )}
            </button>

            {/* Settings Dropdown */}
            {isSettingsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-dark-200 border border-dark-300 rounded-lg shadow-xl py-1 z-[60]">
                {/* Profile Info Section */}
                <div className="px-4 py-3 border-b border-dark-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user?.profilephoto ? (
                        <img
                          src={`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/uploads/${extractFileName(user.profilephoto)}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">{user?.name}</h3>
                      <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                      <p className="text-primary-400 text-xs capitalize mt-1">{user?.role}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-100/50 flex items-center space-x-2 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    // Add settings functionality here
                    setIsSettingsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-100/50 flex items-center space-x-2 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <hr className="border-dark-300 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-100/50 flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Modal */}
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
                                    defaultDuration: item.defaultduration || 1,
                                    price: item.defaultprice
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
                        return Number(total + Number(item.price));
                      }, 0)}
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
                    Proceed To Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};