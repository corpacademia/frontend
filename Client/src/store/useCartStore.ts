
import { create } from 'zustand';
import axios from 'axios';
import { stripePromise } from '../utils/stripe';
import { Currency } from 'lucide-react';

const GST_RATE = Number(import.meta.env.VITE_GST_AMOUNT ?? 18);

interface CartItem {
  id: string;
  labid: string;
  name: string;
  quantity: number;
  price: number;
  duration: number;
  number_of_days?: number;
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
  proceedToCheckout: (params: { userId: string; catalogues: Catalogue[]; org: boolean }) => Promise<void>;
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

  proceedToCheckout: async ({ userId, catalogues, org }) => {

    const cartItems = get().cartItems;
    if (cartItems.length === 0) return;
    try {
      const payload = cartItems.map((item) => {
        const lab = catalogues.find(
          (c) => c.id === item.labid || c.id === item.labid
        );
        const gstAmount = Math.round(Number(item.price) * (GST_RATE / 100));
        return {
          lab_id: item.labid,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          currency: item?.currency,
          duration: item.duration,
          level: lab?.level,
          category: lab?.category,
          by: lab?.provider,
          type: lab?.type,
          user_id: lab?.user_id,
          hoursPerDay: item?.number_hours_day,
          gstRate: GST_RATE,
          gstAmount,
          totalAmount: Number(item.price) + gstAmount,
        };
      });
        
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/create-checkout-session`,
        {
          userId,
          cartItems: payload,
          org
        }
      );
      // const sessionId = response.data.sessionId;
      // const stripe = await stripePromise;
      // if (stripe) {
      //   await stripe.redirectToCheckout({ sessionId });
      // }

      //  const res = await fetch("/api/cashfree-checkout", {
      //   method: "POST",
      //   body: JSON.stringify({ userId, cartItems, org }),
      // });

  const cashfree = Cashfree({ mode: "sandbox" });
  const data = response?.data;
    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self",
    });

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    }
  },

  //  proceedToCheckout: async ({ userId, catalogues }) => {
  //   const cartItems = get().cartItems;
  //   if (cartItems.length === 0) return;
  //   try {
  //     const payload = cartItems.map((item) => {
  //       const lab = catalogues.find(
  //         (c) => c.id === item.labid || c.id === item.labid
  //       );
  //       return {
  //         lab_id: item.labid,
  //         name: item.name,
  //         quantity: item.quantity,
  //         price: item.price,
  //         duration: item.duration,
  //         level: lab?.level,
  //         category: lab?.category,
  //         by: lab?.provider,
  //         type:lab?.type,
  //         user_id:lab?.user_id
  //       };
  //     });
  //     const response = await axios.post(
  //       `${import.meta.env.VITE_BACKEND_URL}/api/v1/lab_ms/create-checkout-session`,
  //       {
  //         amount:200, purpose:"Lab Purchase", buyer_name:'Khan', email:"xyz@gmail.com", phone:988043382,
  //       }
  //     );

  //     if(response.data.success){
  //       window.location.href = response.data.payment_url
  //     }
  //   } catch (error) {
  //     console.error('Checkout error:', error);
  //     alert('Checkout failed. Please try again.');
  //   }
  // },


}));
