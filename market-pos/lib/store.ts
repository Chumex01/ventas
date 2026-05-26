import { create } from "zustand";

interface AuthState {
  token: string | null;
  userName: string | null;
  userRole: string | null;
  hydrated: boolean;
  setAuth: (token: string, name: string, role: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userName: null,
  userRole: null,
  hydrated: false,

  setAuth: (token, name, role) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_name", name);
    localStorage.setItem("user_role", role);
    set({ token, userName: name, userRole: role });
  },

  clearAuth: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    set({ token: null, userName: null, userRole: null });
  },

  hydrate: () => {
    const token = localStorage.getItem("access_token");
    const name = localStorage.getItem("user_name");
    const role = localStorage.getItem("user_role");
    set({ token, userName: name, userRole: role, hydrated: true });
  },
}));

// --- Carrito para POS ---
export interface CartItem {
  producto_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productoId: number) => void;
  updateQuantity: (productoId: number, cantidad: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.producto_id === item.producto_id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.producto_id === item.producto_id
              ? { ...i, cantidad: i.cantidad + item.cantidad }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (productoId) => {
    set((state) => ({
      items: state.items.filter((i) => i.producto_id !== productoId),
    }));
  },

  updateQuantity: (productoId, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(productoId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.producto_id === productoId ? { ...i, cantidad } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),

  count: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
}));