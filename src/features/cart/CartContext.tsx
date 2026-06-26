import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Product } from "@/shared/types";
import { getProductById } from "@/shared/mocks";

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
}

type CartAction =
  | { type: "ADD"; product: Product; quantity?: number }
  | { type: "SET_QTY"; productId: string; quantity: number }
  | { type: "REMOVE"; productId: string }
  | { type: "CLEAR" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.lines.find((l) => l.product.id === action.product.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.product.id === action.product.id
              ? { ...l, quantity: l.quantity + (action.quantity ?? 1) }
              : l,
          ),
        };
      }
      return { lines: [...state.lines, { product: action.product, quantity: action.quantity ?? 1 }] };
    }
    case "SET_QTY":
      return {
        lines: state.lines
          .map((l) => (l.product.id === action.productId ? { ...l, quantity: action.quantity } : l))
          .filter((l) => l.quantity > 0),
      };
    case "REMOVE":
      return { lines: state.lines.filter((l) => l.product.id !== action.productId) };
    case "CLEAR":
      return { lines: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, quantity?: number) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Seed with a couple of items so the cart/checkout screen looks alive on first load. */
function init(): CartState {
  const seeds: [string, number][] = [
    ["prod_heritage_ghee", 1],
    ["prod_forest_honey", 2],
  ];
  const lines = seeds
    .map(([id, quantity]) => {
      const product = getProductById(id);
      return product ? { product, quantity } : null;
    })
    .filter((l): l is CartLine => l !== null);
  return { lines };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = state.lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
    return {
      lines: state.lines,
      count,
      subtotal,
      add: (product, quantity) => dispatch({ type: "ADD", product, quantity }),
      setQty: (productId, quantity) => dispatch({ type: "SET_QTY", productId, quantity }),
      remove: (productId) => dispatch({ type: "REMOVE", productId }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state.lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
