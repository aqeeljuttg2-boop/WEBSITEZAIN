'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PricingTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  sku: string;
  description: string | null;
  specifications?: string | null;
  material: string | null;
  size: string | null;
  finish: string | null;
  weight?: string | null;
  images: string;
  moq: number;
  singlePrice: number;
  stock: number;
  pricingTiers?: PricingTier[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number; // Computed based on quantity and tiers
}

export interface QuoteItem {
  product: Product;
  quantity: number;
  requiredSize?: string;
  material?: string;
  finish?: string;
  additionalRequirements?: string;
}

interface CartContextType {
  cart: CartItem[];
  quote: QuoteItem[];
  addToCart: (product: Product, quantity: number) => { success: boolean; message: string };
  updateCartQty: (productId: string, quantity: number) => { success: boolean; message: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  addToQuote: (product: Product, quantity: number, details?: Partial<Omit<QuoteItem, 'product' | 'quantity'>>) => void;
  updateQuoteQty: (productId: string, quantity: number) => void;
  updateQuoteDetails: (productId: string, details: Partial<Omit<QuoteItem, 'product' | 'quantity'>>) => void;
  removeFromQuote: (productId: string) => void;
  clearQuote: () => void;
  
  getCartSubtotal: () => number;
  getCartItemsCount: () => number;
  getQuoteItemsCount: () => number;
  getItemPrice: (product: Product, quantity: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quote, setQuote] = useState<QuoteItem[]>([]);

  // Load cart and quote from localStorage on mount and sync across tabs
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const savedCart = localStorage.getItem('apex_cart');
        const savedQuote = localStorage.getItem('apex_quote');
        if (savedCart) setCart(JSON.parse(savedCart));
        if (savedQuote) setQuote(JSON.parse(savedQuote));
      } catch (e) {
        console.error('Error loading cart/quote from storage:', e);
      }
    };

    loadFromStorage();

    // Cross-tab BroadcastChannel sync
    let cartChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        cartChannel = new BroadcastChannel('ltl_cart_channel');
        cartChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_CART') {
            if (event.data.cart) setCart(event.data.cart);
            if (event.data.quote) setQuote(event.data.quote);
          }
        };
      } catch (err) {
        console.error('BroadcastChannel error:', err);
      }
    }

    // Window storage event fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'apex_cart' && e.newValue) {
        try { setCart(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'apex_quote' && e.newValue) {
        try { setQuote(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (cartChannel) cartChannel.close();
    };
  }, []);

  // Save cart and broadcast to other tabs
  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem('apex_cart', JSON.stringify(cart));
    localStorage.setItem('apex_quote', JSON.stringify(quote));

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('ltl_cart_channel');
        bc.postMessage({ type: 'SYNC_CART', cart, quote });
        bc.close();
      } catch {}
    }
  }, [cart, quote]);

  // Helper to compute unit price based on pricing tiers
  const getItemPrice = (product: Product, quantity: number): number => {
    let price = product.singlePrice;
    if (product.pricingTiers && product.pricingTiers.length > 0) {
      const tier = product.pricingTiers.find(t => {
        if (t.maxQuantity === null) {
          return quantity >= t.minQuantity;
        }
        return quantity >= t.minQuantity && quantity <= t.maxQuantity;
      });
      if (tier) {
        price = tier.pricePerUnit;
      }
    }
    return price;
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const validQty = Math.max(1, quantity);
    const unitPrice = getItemPrice(product, validQty);
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    let newCart = [...cart];
    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + validQty;
      const newPrice = getItemPrice(product, newQty);
      newCart[existingIndex] = {
        product,
        quantity: newQty,
        unitPrice: newPrice
      };
    } else {
      newCart.push({
        product,
        quantity: validQty,
        unitPrice
      });
    }

    // Adjust prices for all items in case bulk discount tiers were crossed
    newCart = newCart.map(item => ({
      ...item,
      unitPrice: getItemPrice(item.product, item.quantity)
    }));

    setCart(newCart);
    return { success: true, message: `${product.name} added to cart.` };
  };

  const updateCartQty = (productId: string, quantity: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return { success: false, message: 'Item not in cart' };

    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true, message: 'Item removed from cart' };
    }

    const validQty = Math.max(1, quantity);
    const newCart = cart.map(i => {
      if (i.product.id === productId) {
        return {
          ...i,
          quantity: validQty,
          unitPrice: getItemPrice(i.product, validQty)
        };
      }
      return i;
    });

    setCart(newCart);
    return { success: true, message: 'Cart updated' };
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // RFQ Quote Cart logic
  const addToQuote = (product: Product, quantity: number, details?: Partial<Omit<QuoteItem, 'product' | 'quantity'>>) => {
    const existingIndex = quote.findIndex(item => item.product.id === product.id);
    const newQuote = [...quote];

    if (existingIndex > -1) {
      newQuote[existingIndex] = {
        ...newQuote[existingIndex],
        quantity: newQuote[existingIndex].quantity + quantity,
        ...details
      };
    } else {
      newQuote.push({
        product,
        quantity,
        requiredSize: details?.requiredSize || product.size || '',
        material: details?.material || product.material || '',
        finish: details?.finish || product.finish || '',
        additionalRequirements: details?.additionalRequirements || '',
      });
    }

    setQuote(newQuote);
  };

  const updateQuoteQty = (productId: string, quantity: number) => {
    setQuote(quote.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    }));
  };

  const updateQuoteDetails = (productId: string, details: Partial<Omit<QuoteItem, 'product' | 'quantity'>>) => {
    setQuote(quote.map(item => {
      if (item.product.id === productId) {
        return { ...item, ...details };
      }
      return item;
    }));
  };

  const removeFromQuote = (productId: string) => {
    setQuote(quote.filter(item => item.product.id !== productId));
  };

  const clearQuote = () => {
    setQuote([]);
  };

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getQuoteItemsCount = () => {
    return quote.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      quote,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      addToQuote,
      updateQuoteQty,
      updateQuoteDetails,
      removeFromQuote,
      clearQuote,
      getCartSubtotal,
      getCartItemsCount,
      getQuoteItemsCount,
      getItemPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
