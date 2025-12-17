import type { 
  Store, Staff, Ingredient, Dish, Recipe, StoreStock, 
  PaymentMethod, Transaction, Expense, SplitConfig, Supplier 
} from '@/types/pos';

export const stores: Store[] = [
  { id: 'store-1', name: 'Downtown Kitchen', location: 'Maputo Centro', managerId: 'staff-1' },
  { id: 'store-2', name: 'Beach Grill', location: 'Costa do Sol', managerId: 'staff-2' },
];

export const staff: Staff[] = [
  { id: 'staff-1', name: 'Maria Santos', role: 'admin', storeId: 'store-1' },
  { id: 'staff-2', name: 'João Silva', role: 'store_lead', storeId: 'store-2' },
  { id: 'staff-3', name: 'Ana Costa', role: 'staff', storeId: 'store-1' },
  { id: 'staff-4', name: 'Pedro Nunes', role: 'staff', storeId: 'store-2' },
];

export const ingredients: Ingredient[] = [
  { id: 'ing-1', name: 'Beef Patty', unit: 'units', averageCost: 45, category: 'meat' },
  { id: 'ing-2', name: 'Burger Bun', unit: 'units', averageCost: 15, category: 'dry_goods' },
  { id: 'ing-3', name: 'Cheese Slice', unit: 'units', averageCost: 12, category: 'dairy' },
  { id: 'ing-4', name: 'Lettuce', unit: 'grams', averageCost: 0.08, category: 'produce' },
  { id: 'ing-5', name: 'Tomato', unit: 'grams', averageCost: 0.06, category: 'produce' },
  { id: 'ing-6', name: 'Onion', unit: 'grams', averageCost: 0.04, category: 'produce' },
  { id: 'ing-7', name: 'French Fries', unit: 'grams', averageCost: 0.05, category: 'produce' },
  { id: 'ing-8', name: 'Chicken Breast', unit: 'grams', averageCost: 0.12, category: 'meat' },
  { id: 'ing-9', name: 'Rice', unit: 'grams', averageCost: 0.03, category: 'dry_goods' },
  { id: 'ing-10', name: 'Coca-Cola 330ml', unit: 'units', averageCost: 25, category: 'beverages' },
  { id: 'ing-11', name: 'Cooking Oil', unit: 'liters', averageCost: 180, category: 'other' },
  { id: 'ing-12', name: 'Sauce Mix', unit: 'grams', averageCost: 0.15, category: 'other' },
];

export const dishes: Dish[] = [
  { id: 'dish-1', name: 'Classic Burger', category: 'Burgers', sellingPrice: 280 },
  { id: 'dish-2', name: 'Cheese Burger', category: 'Burgers', sellingPrice: 320 },
  { id: 'dish-3', name: 'Double Burger', category: 'Burgers', sellingPrice: 420 },
  { id: 'dish-4', name: 'Grilled Chicken', category: 'Mains', sellingPrice: 350 },
  { id: 'dish-5', name: 'Chicken & Rice', category: 'Mains', sellingPrice: 280 },
  { id: 'dish-6', name: 'French Fries', category: 'Sides', sellingPrice: 80 },
  { id: 'dish-7', name: 'Large Fries', category: 'Sides', sellingPrice: 120 },
  { id: 'dish-8', name: 'Coca-Cola', category: 'Beverages', sellingPrice: 50 },
  { id: 'dish-9', name: 'Salad Bowl', category: 'Sides', sellingPrice: 150 },
];

export const recipes: Recipe[] = [
  // Classic Burger
  { id: 'rec-1', dishId: 'dish-1', ingredientId: 'ing-1', quantityRequired: 1 },
  { id: 'rec-2', dishId: 'dish-1', ingredientId: 'ing-2', quantityRequired: 1 },
  { id: 'rec-3', dishId: 'dish-1', ingredientId: 'ing-4', quantityRequired: 30 },
  { id: 'rec-4', dishId: 'dish-1', ingredientId: 'ing-5', quantityRequired: 40 },
  { id: 'rec-5', dishId: 'dish-1', ingredientId: 'ing-6', quantityRequired: 20 },
  // Cheese Burger
  { id: 'rec-6', dishId: 'dish-2', ingredientId: 'ing-1', quantityRequired: 1 },
  { id: 'rec-7', dishId: 'dish-2', ingredientId: 'ing-2', quantityRequired: 1 },
  { id: 'rec-8', dishId: 'dish-2', ingredientId: 'ing-3', quantityRequired: 1 },
  { id: 'rec-9', dishId: 'dish-2', ingredientId: 'ing-4', quantityRequired: 30 },
  { id: 'rec-10', dishId: 'dish-2', ingredientId: 'ing-5', quantityRequired: 40 },
  // Double Burger
  { id: 'rec-11', dishId: 'dish-3', ingredientId: 'ing-1', quantityRequired: 2 },
  { id: 'rec-12', dishId: 'dish-3', ingredientId: 'ing-2', quantityRequired: 1 },
  { id: 'rec-13', dishId: 'dish-3', ingredientId: 'ing-3', quantityRequired: 2 },
  { id: 'rec-14', dishId: 'dish-3', ingredientId: 'ing-4', quantityRequired: 40 },
  // Grilled Chicken
  { id: 'rec-15', dishId: 'dish-4', ingredientId: 'ing-8', quantityRequired: 200 },
  { id: 'rec-16', dishId: 'dish-4', ingredientId: 'ing-12', quantityRequired: 30 },
  // Chicken & Rice
  { id: 'rec-17', dishId: 'dish-5', ingredientId: 'ing-8', quantityRequired: 150 },
  { id: 'rec-18', dishId: 'dish-5', ingredientId: 'ing-9', quantityRequired: 200 },
  { id: 'rec-19', dishId: 'dish-5', ingredientId: 'ing-12', quantityRequired: 20 },
  // French Fries
  { id: 'rec-20', dishId: 'dish-6', ingredientId: 'ing-7', quantityRequired: 150 },
  // Large Fries
  { id: 'rec-21', dishId: 'dish-7', ingredientId: 'ing-7', quantityRequired: 250 },
  // Coca-Cola
  { id: 'rec-22', dishId: 'dish-8', ingredientId: 'ing-10', quantityRequired: 1 },
  // Salad Bowl
  { id: 'rec-23', dishId: 'dish-9', ingredientId: 'ing-4', quantityRequired: 100 },
  { id: 'rec-24', dishId: 'dish-9', ingredientId: 'ing-5', quantityRequired: 80 },
  { id: 'rec-25', dishId: 'dish-9', ingredientId: 'ing-6', quantityRequired: 30 },
];

export const storeStocks: StoreStock[] = [
  // Store 1 Stock
  { id: 'ss-1', storeId: 'store-1', ingredientId: 'ing-1', currentQuantity: 45, minThreshold: 20, targetStock: 100 },
  { id: 'ss-2', storeId: 'store-1', ingredientId: 'ing-2', currentQuantity: 60, minThreshold: 30, targetStock: 100 },
  { id: 'ss-3', storeId: 'store-1', ingredientId: 'ing-3', currentQuantity: 15, minThreshold: 20, targetStock: 80 },
  { id: 'ss-4', storeId: 'store-1', ingredientId: 'ing-4', currentQuantity: 2000, minThreshold: 1000, targetStock: 5000 },
  { id: 'ss-5', storeId: 'store-1', ingredientId: 'ing-5', currentQuantity: 800, minThreshold: 1000, targetStock: 3000 },
  { id: 'ss-6', storeId: 'store-1', ingredientId: 'ing-6', currentQuantity: 1500, minThreshold: 500, targetStock: 2000 },
  { id: 'ss-7', storeId: 'store-1', ingredientId: 'ing-7', currentQuantity: 8000, minThreshold: 5000, targetStock: 15000 },
  { id: 'ss-8', storeId: 'store-1', ingredientId: 'ing-8', currentQuantity: 3000, minThreshold: 2000, targetStock: 8000 },
  { id: 'ss-9', storeId: 'store-1', ingredientId: 'ing-9', currentQuantity: 10000, minThreshold: 5000, targetStock: 20000 },
  { id: 'ss-10', storeId: 'store-1', ingredientId: 'ing-10', currentQuantity: 35, minThreshold: 24, targetStock: 72 },
  { id: 'ss-11', storeId: 'store-1', ingredientId: 'ing-11', currentQuantity: 8, minThreshold: 5, targetStock: 15 },
  { id: 'ss-12', storeId: 'store-1', ingredientId: 'ing-12', currentQuantity: 500, minThreshold: 300, targetStock: 1000 },
  // Store 2 Stock
  { id: 'ss-13', storeId: 'store-2', ingredientId: 'ing-1', currentQuantity: 30, minThreshold: 20, targetStock: 80 },
  { id: 'ss-14', storeId: 'store-2', ingredientId: 'ing-2', currentQuantity: 40, minThreshold: 25, targetStock: 80 },
  { id: 'ss-15', storeId: 'store-2', ingredientId: 'ing-3', currentQuantity: 25, minThreshold: 15, targetStock: 60 },
  { id: 'ss-16', storeId: 'store-2', ingredientId: 'ing-4', currentQuantity: 1200, minThreshold: 800, targetStock: 3000 },
  { id: 'ss-17', storeId: 'store-2', ingredientId: 'ing-5', currentQuantity: 1800, minThreshold: 800, targetStock: 2500 },
  { id: 'ss-18', storeId: 'store-2', ingredientId: 'ing-6', currentQuantity: 900, minThreshold: 400, targetStock: 1500 },
  { id: 'ss-19', storeId: 'store-2', ingredientId: 'ing-7', currentQuantity: 4500, minThreshold: 4000, targetStock: 12000 },
  { id: 'ss-20', storeId: 'store-2', ingredientId: 'ing-8', currentQuantity: 2500, minThreshold: 1500, targetStock: 6000 },
  { id: 'ss-21', storeId: 'store-2', ingredientId: 'ing-9', currentQuantity: 8000, minThreshold: 4000, targetStock: 15000 },
  { id: 'ss-22', storeId: 'store-2', ingredientId: 'ing-10', currentQuantity: 48, minThreshold: 24, targetStock: 60 },
  { id: 'ss-23', storeId: 'store-2', ingredientId: 'ing-11', currentQuantity: 6, minThreshold: 4, targetStock: 12 },
  { id: 'ss-24', storeId: 'store-2', ingredientId: 'ing-12', currentQuantity: 400, minThreshold: 250, targetStock: 800 },
];

export const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', isRevenue: true, isCash: true, icon: '💵' },
  { id: 'mpesa', name: 'M-Pesa', isRevenue: true, isCash: true, icon: '📱' },
  { id: 'mkesh', name: 'M-Kesh', isRevenue: true, isCash: true, icon: '💳' },
  { id: 'paga_facil', name: 'Paga Fácil', isRevenue: true, isCash: true, icon: '🏦' },
  { id: 'credit', name: 'Credit', isRevenue: false, isCash: false, icon: '📝' },
  { id: 'self_consumption', name: 'Self Consumption', isRevenue: false, isCash: false, icon: '🍽️' },
];

export const suppliers: Supplier[] = [
  { id: 'sup-1', name: 'Fresh Farms Co.', contactInfo: '+258 84 123 4567' },
  { id: 'sup-2', name: 'Meat Masters', contactInfo: '+258 84 234 5678' },
  { id: 'sup-3', name: 'Beverage Distributors', contactInfo: '+258 84 345 6789' },
];

export const splitConfigs: SplitConfig[] = [
  { id: 'split-1', name: 'Standard Weekday', restockPercent: 30, taxPercent: 10, bankPercent: 20, opsPercent: 40 },
  { id: 'split-2', name: 'Weekend Peak', restockPercent: 35, taxPercent: 10, bankPercent: 25, opsPercent: 30 },
  { id: 'split-3', name: 'Slow Season', restockPercent: 25, taxPercent: 10, bankPercent: 15, opsPercent: 50 },
];

// Sample transactions for today
export const todayTransactions: Transaction[] = [
  { 
    id: 'trans-1', 
    date: new Date().toISOString(), 
    items: [
      { dishId: 'dish-2', quantity: 2, unitPrice: 320 },
      { dishId: 'dish-6', quantity: 2, unitPrice: 80 },
      { dishId: 'dish-8', quantity: 2, unitPrice: 50 },
    ],
    totalAmount: 900,
    paymentMethodId: 'cash',
    staffId: 'staff-3',
    storeId: 'store-1'
  },
  { 
    id: 'trans-2', 
    date: new Date().toISOString(), 
    items: [
      { dishId: 'dish-5', quantity: 3, unitPrice: 280 },
    ],
    totalAmount: 840,
    paymentMethodId: 'mpesa',
    staffId: 'staff-3',
    storeId: 'store-1'
  },
  { 
    id: 'trans-3', 
    date: new Date().toISOString(), 
    items: [
      { dishId: 'dish-1', quantity: 1, unitPrice: 280 },
      { dishId: 'dish-8', quantity: 1, unitPrice: 50 },
    ],
    totalAmount: 330,
    paymentMethodId: 'credit',
    staffId: 'staff-3',
    storeId: 'store-1'
  },
  { 
    id: 'trans-4', 
    date: new Date().toISOString(), 
    items: [
      { dishId: 'dish-4', quantity: 2, unitPrice: 350 },
    ],
    totalAmount: 700,
    paymentMethodId: 'self_consumption',
    staffId: 'staff-1',
    storeId: 'store-1'
  },
];

export const todayExpenses: Expense[] = [
  { 
    id: 'exp-1', 
    amount: 500, 
    date: new Date().toISOString(), 
    category: 'stock', 
    description: 'Emergency tomatoes purchase',
    isDeducted: false,
    storeId: 'store-1',
    staffId: 'staff-1'
  },
  { 
    id: 'exp-2', 
    amount: 200, 
    date: new Date().toISOString(), 
    category: 'ops', 
    description: 'Cleaning supplies',
    isDeducted: false,
    storeId: 'store-1',
    staffId: 'staff-3'
  },
];
