// Core entity types for POS & Inventory Control System

export type UserRole = 'admin' | 'store_lead' | 'staff';

export interface Store {
  id: string;
  name: string;
  location: string;
  managerId: string;
}

export interface Staff {
  id: string;
  name: string;
  role: UserRole;
  storeId: string;
  avatar?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'kg' | 'liters' | 'units' | 'grams';
  averageCost: number;
  category: 'produce' | 'meat' | 'dairy' | 'dry_goods' | 'beverages' | 'other';
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  image?: string;
}

export interface Recipe {
  id: string;
  dishId: string;
  ingredientId: string;
  quantityRequired: number;
}

export interface StoreStock {
  id: string;
  storeId: string;
  ingredientId: string;
  currentQuantity: number;
  minThreshold: number;
  targetStock: number;
}

export type PaymentMethodType = 'cash' | 'mpesa' | 'mkesh' | 'paga_facil' | 'credit' | 'self_consumption';

export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  isRevenue: boolean;
  isCash: boolean;
  icon: string;
}

export interface Transaction {
  id: string;
  date: string;
  items: TransactionItem[];
  totalAmount: number;
  paymentMethodId: PaymentMethodType;
  staffId: string;
  storeId: string;
}

export interface TransactionItem {
  dishId: string;
  quantity: number;
  unitPrice: number;
}

export type ExpenseCategory = 'stock' | 'ops' | 'salary' | 'utilities' | 'other';

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string;
  isDeducted: boolean;
  storeId: string;
  staffId: string;
}

export interface InventoryLog {
  id: string;
  ingredientId: string;
  supplierId?: string;
  changeAmount: number;
  purchasePrice?: number;
  date: string;
  reason: 'purchase' | 'sale' | 'waste' | 'adjustment';
}

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string;
}

export interface SplitConfig {
  id: string;
  name: string;
  restockPercent: number;
  taxPercent: number;
  bankPercent: number;
  opsPercent: number;
}

export interface DailyClosing {
  id: string;
  date: string;
  storeId: string;
  totalSales: number;
  totalCashInDrawer: number;
  nonRevenueAmount: number;
  netRevenue: number;
  restockPotCalculated: number;
  expensesDeducted: number;
  finalRestockTransfer: number;
  splitConfigId: string;
}

export interface RestockItem {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  targetStock: number;
  amountToBuy: number;
  unit: string;
  isUrgent: boolean;
  isFulfilled: boolean;
}

// Cart types for POS
export interface CartItem {
  dish: Dish;
  quantity: number;
}
