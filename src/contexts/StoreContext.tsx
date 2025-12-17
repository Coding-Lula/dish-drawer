import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Store, Staff, CartItem, Transaction, Expense, StoreStock } from '@/types/pos';
import { stores, staff, storeStocks as initialStocks, todayTransactions, todayExpenses } from '@/data/mockData';

interface StoreContextType {
  currentStore: Store;
  currentStaff: Staff;
  stores: Store[];
  setCurrentStore: (store: Store) => void;
  setCurrentStaff: (staff: Staff) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (dishId: string) => void;
  updateCartQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  storeStocks: StoreStock[];
  updateStock: (ingredientId: string, changeAmount: number) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store>(stores[0]);
  const [currentStaff, setCurrentStaff] = useState<Staff>(staff[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(todayTransactions);
  const [expenses, setExpenses] = useState<Expense[]>(todayExpenses);
  const [storeStocks, setStoreStocks] = useState<StoreStock[]>(initialStocks);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.dish.id === item.dish.id);
      if (existing) {
        return prev.map(i => 
          i.dish.id === item.dish.id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (dishId: string) => {
    setCart(prev => prev.filter(i => i.dish.id !== dishId));
  };

  const updateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setCart(prev => prev.map(i => 
      i.dish.id === dishId ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.dish.sellingPrice * item.quantity), 0);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const updateStock = (ingredientId: string, changeAmount: number) => {
    setStoreStocks(prev => prev.map(stock => {
      if (stock.ingredientId === ingredientId && stock.storeId === currentStore.id) {
        return { ...stock, currentQuantity: Math.max(0, stock.currentQuantity + changeAmount) };
      }
      return stock;
    }));
  };

  return (
    <StoreContext.Provider value={{
      currentStore,
      currentStaff,
      stores,
      setCurrentStore,
      setCurrentStaff,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      transactions,
      addTransaction,
      expenses,
      addExpense,
      storeStocks,
      updateStock,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
