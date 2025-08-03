import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { SettingsModal } from '../modals/SettingsModal';
import { 
  BeakerIcon, 
  BookOpenIcon, 
  UserIcon, 
  LayoutDashboardIcon,
  GraduationCapIcon,
  AwardIcon,
  CloudIcon,
  SettingsIcon,
  LogOut,
  User,
  ShoppingCart,
  X,
  Edit
} from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import axios from 'axios';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCartItems = async () => {
    if (!isAuthenticated) return;

    setIsLoadingCart(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCartItems/${user?.id}`);
      if (response.data.success) {
        setCartItems(response.data.data.map((cart: any) => ({
          ...cart,
          defaultDuration: cart.duration
        })));
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setIsLoadingCart(false);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/removeFromCart/${cartItemId}`);
      if (response.data.success) {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/clearCart/${user?.id}`);
      if (response.data.success) {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const updateCartItem = async (cartItemId: string, updates: { duration?: string; quantity?: number, defaultDuration?: number, price?: number }) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateCartItem/${cartItemId}`, updates);
      if (response.data.success) {
        setCartItems(prev => prev.map(item => 
          item.id === cartItemId ? { ...item, ...updates } : item
        ));
        setEditingCartItem(null);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartItems();
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      if (isAuthenticated) {
        fetchCartItems();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [isAuthenticated]);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-200 border-b border-dark-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <BeakerIcon className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                GoLabing.ai
              </span>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/labs" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 border-b-2 border-transparent hover:border-primary-400 hover:text-primary-300"
              >
                <BookOpenIcon className="h-4 w-4 mr-1" />
                Labs
              </Link>
              <Link 
                to="/learning-paths" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-400 hover:text-primary-300 border-b-2 border-transparent hover:border-primary-400"
              >
                <GraduationCapIcon className="h-4 w-4 mr-1" />
                Learning Paths
              </Link>
              <Link 
                to="/assessments" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-400 hover:text-primary-300 border-b-2 border-transparent hover:border-primary-400"
              >
                <AwardIcon className="h-4 w-4 mr-1" />
                Assessments
              </Link>
              <Link 
                to="/cloud-labs" 
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-400 hover:text-primary-300 border-b-2 border-transparent hover:border-primary-400"
              >
                <CloudIcon className="h-4 w-4 mr-1" />
                Cloud Labs
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-primary-300"
                >
                  <LayoutDashboardIcon className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
                
                {/* Cart Button */}
                <button
                  onClick={() => setIsCartModalOpen(true)}
                  className="relative p-2 text-gray-400 hover:text-primary-300 bg-dark-300 hover:bg-dark-100/50 rounded-full transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 
                                   text-white text-xs rounded-full h-5 w-5 flex items-center justify-center 
                                   font-semibold shadow-lg">
                      {cartItems.reduce((total, item) => total + Number(item.quantity), 0)}
                    </span>
                  )}
                </button>
                
                <Link 
                  to="/profile" 
                  className="p-1 rounded-full text-gray-400 hover:text-primary-300 bg-dark-300 hover:bg-dark-100/50 transition-colors"
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sm font-medium text-gray-400 hover:text-primary-300"
                >
                  Logout
                </button>

              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-400 hover:text-primary-300"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

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
                                  onClick={() => updateCartItem(item.id, {
                                    duration: editingCartItem.duration || item.duration,
                                    quantity: editingCartItem.quantity || item.quantity,
                                    defaultDuration: item.defaultDuration || 1,
                                    price: item.price
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
                              {(() => {
                                const defaultDuration = item.defaultDuration || 1;
                                const currentDuration = item.duration || defaultDuration;
                                const adjustedPricePerUnit = item.price * (currentDuration / defaultDuration);
                                const totalPrice = adjustedPricePerUnit * item.quantity;
                                return (
                                  <span className="font-semibold text-white">
                                    ₹{totalPrice.toFixed(2)}
                                  </span>
                                );
                              })()}
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
                        const defaultDuration = item.defaultDuration || 1;
                        const currentDuration = item.duration || defaultDuration;
                        const adjustedPrice = item.price * (currentDuration / defaultDuration);
                        return total + adjustedPrice * item.quantity;
                      }, 0).toFixed(2)}
                    </span>
                    <p className="text-sm text-gray-400">
                      {cartItems.reduce((total, item) => total + Number(item.quantity), 0)} item(s)
                    </p>
                  </div>
                  <button
                    onClick={clearCart}
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
                    onClick={() => navigate('/labs/catalogue')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500
                             hover:from-primary-400 hover:to-secondary-400
                             rounded-lg transition-all duration-300 text-white font-semibold
                             shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
                  >
                    Go to Catalogue
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
