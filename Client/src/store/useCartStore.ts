
import { create } from 'zustand';
import axios from 'axios';
import { stripePromise } from '../utils/stripe'; 

interface CartItem {
  id: string;
  labid: string;
  name: string;
  quantity: number;
  price: number;
  duration: number;
  [key: string]: any;
}

interface Catalogue {
  labid: string;
  name: string;
  level: string;
  category: string;
  provider: string;
  [key: string]: any;
}

interface CartStore {
  cartItems: CartItem[];
  isLoadingCart: boolean;
  fetchCartItems: (userId: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: (userId: string) => Promise<void>;
  updateCartItem: (cartItemId: string, updates: Partial<CartItem>) => Promise<boolean>;
  proceedToCheckout: (params: { userId: string; catalogues: Catalogue[] }) => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartItems: [],
  isLoadingCart: false,

  fetchCartItems: async (userId) => {
    set({ isLoadingCart: true });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/getCartItems/${userId}`
      );
      if (response.data.success) {
        set({ cartItems: response.data.data });
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      set({ isLoadingCart: false });
    }
  },

  removeFromCart: async (cartItemId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/removeFromCart/${cartItemId}`
      );
      if (response.data.success) {
        set({
          cartItems: get().cartItems.filter((item) => item.id !== cartItemId),
        });
        window.dispatchEvent(new CustomEvent('cartRefresh'));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  },

  clearCart: async (userId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/clearCart/${userId}`
      );
      if (response.data.success) {
        set({ cartItems: [] });
        window.dispatchEvent(new CustomEvent('cartRefresh'));
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  updateCartItem: async (cartItemId, updates) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/updateCartItem/${cartItemId}`,
        updates
      );
      if (response.data.success) {
        set({
          cartItems: get().cartItems.map((item) =>
            item.id === cartItemId ? { ...response.data.data } : item
          ),
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
    return false;
  },

  proceedToCheckout: async ({ userId, catalogues }) => {
    const cartItems = get().cartItems;
    if (cartItems.length === 0) return;

    try {
      const payload = cartItems.map((item) => {
        const lab = catalogues.find(
          (c) => c.labid === item.labid || c.lab_id === item.labid
        );
        return {
          lab_id: item.labid,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          duration: item.duration,
          level: lab?.level,
          category: lab?.category,
          by: lab?.provider,
        };
      });

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/create-checkout-session`,
        {
          userId,
          cartItems: payload,
        }
      );

      const sessionId = response.data.sessionId;
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    }
  },
}));
