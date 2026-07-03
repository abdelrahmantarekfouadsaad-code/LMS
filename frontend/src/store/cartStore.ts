import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Course {
  id: string;
  title: string;
  titleAr: string;
  instructor: string;
  duration: string;
  price: number;
  color: string;
}

interface CartState {
  cartItems: Course[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  removeManyFromCart: (courseIds: string[]) => void;
  clearCart: () => void;
}
  cartItems: Course[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      addToCart: (course) =>
        set((state) => {
          if (state.cartItems.find((c) => c.id === course.id)) {
            return state; // Already in cart
          }
          return { cartItems: [...state.cartItems, course] };
        }),
      removeFromCart: (courseId) =>
        set((state) => ({
          cartItems: state.cartItems.filter((c) => c.id !== courseId),
        })),
      removeManyFromCart: (courseIds) =>
        set((state) => ({
          cartItems: state.cartItems.filter((c) => !courseIds.includes(c.id)),
        })),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'lms-cart-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
