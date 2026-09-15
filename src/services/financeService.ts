import type { IncomeSource } from '@/hooks/useFinanceData';
import type { Dish, Recipe, Ingredient, Expense, Transaction, TransactionItem } from '@/hooks/useSupabaseData';
import type { FinancialTransaction } from '@/hooks/useFinanceData';

export interface PerformanceCategoryStats {
  name: string;
  revenue: number;
  quantity: number;
}

export interface PerformanceItemStats {
  name: string;
  revenue: number;
  quantity: number;
}

export interface PerformanceAnalytics {
  topCategories: PerformanceCategoryStats[];
  topItems: PerformanceItemStats[];
}

export interface LowMarginItem extends Dish {
  margin: number;
  totalCost: number;
}

export interface ExpenseCategoryBreakdown {
  categoryName: string;
  totalAmount: number;
}

export interface IncomeStatement {
  grossRevenue: number;
  cogs: number; // Custo das Mercadorias Vendidas (CMV)
  grossProfit: number;
  grossMarginPercent: number;
  operationalExpenses: number;
  financialExpenses: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPercent: number;
  operationalBreakdown: ExpenseCategoryBreakdown[];
  financialBreakdown: ExpenseCategoryBreakdown[];
}

/**
 * Calculates Cost of Goods Sold (COGS / CMV) based on sold transaction items,
 * ingredient costs, and expenses categorized as type Stock (Estoque).
 */
export function calculateCOGS(
  transactions: Transaction[],
  transactionItems: TransactionItem[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  storeId: string,
  monthStart: string,
  monthEnd: string,
  rawExpenses: Expense[] = []
): number {
  const storeTxIds = new Set(
    transactions
      .filter(t => {
        const txDate = t.date?.split('T')[0];
        return (
          t.store_id === storeId &&
          txDate >= monthStart &&
          txDate <= monthEnd &&
          t.payment_method &&
          t.payment_method !== 'self_consumption'
        );
      })
      .map(t => t.id)
  );

  const soldItems = transactionItems.filter(item => storeTxIds.has(item.transaction_id));

  let totalCOGS = 0;

  soldItems.forEach(item => {
    if (!item.dish_id) return;
    const dishRecipes = recipes.filter(r => r.dish_id === item.dish_id);
    const unitIngredientCost = dishRecipes.reduce((sum, r) => {
      const ingredient = ingredients.find(i => i.id === r.ingredient_id);
      return sum + Number(ingredient?.average_cost || 0) * Number(r.quantity_required);
    }, 0);

    totalCOGS += unitIngredientCost * Number(item.quantity);
  });

  // Include expenses categorized as 'Stock' / 'Estoque'
  const stockExpenses = rawExpenses
    .filter(e => {
      const eDate = e.date?.split('T')[0];
      const category = (e.category || '').toLowerCase();
      return (
        e.store_id === storeId &&
        eDate >= monthStart &&
        eDate <= monthEnd &&
        (category === 'stock' || category === 'estoque')
      );
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return totalCOGS + stockExpenses;
}

/**
 * Calculates the complete Income Statement (Demonstração de Resultados / DRE).
 */
export function calculateIncomeStatement(
  transactions: Transaction[],
  transactionItems: TransactionItem[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  rawExpenses: Expense[],
  financialTransactions: FinancialTransaction[],
  expenseCategories: { id: string; name: string }[] = [],
  storeId: string,
  monthStart: string,
  monthEnd: string
): IncomeStatement {
  const grossRevenue = calculateStoreRevenue(transactions, storeId, monthStart, monthEnd);
  const cogs = calculateCOGS(
    transactions,
    transactionItems,
    recipes,
    ingredients,
    storeId,
    monthStart,
    monthEnd,
    rawExpenses
  );
  const grossProfit = grossRevenue - cogs;
  const grossMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

  const {
    operational: operationalExpenses,
    financial: financialExpenses,
    total: totalExpenses,
    operationalBreakdown,
    financialBreakdown,
  } = calculateStoreExpenses(
    rawExpenses,
    financialTransactions,
    storeId,
    monthStart,
    monthEnd,
    expenseCategories
  );

  const netProfit = grossProfit - totalExpenses;
  const netMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    grossRevenue,
    cogs,
    grossProfit,
    grossMarginPercent,
    operationalExpenses,
    financialExpenses,
    totalExpenses,
    netProfit,
    netMarginPercent,
    operationalBreakdown,
    financialBreakdown,
  };
}

/**
 * Calculates revenue for a specific store within a date range.
 */
export function calculateStoreRevenue(
  transactions: Transaction[],
  storeId: string,
  monthStart: string,
  monthEnd: string
): number {
  return transactions
    .filter(t => {
      const txDate = t.date?.split('T')[0];
      return (
        t.store_id === storeId &&
        txDate >= monthStart &&
        txDate <= monthEnd &&
        t.payment_method &&
        t.payment_method !== 'credit' &&
        t.payment_method !== 'self_consumption'
      );
    })
    .reduce((sum, t) => sum + Number(t.total_amount), 0);
}

/**
 * Calculates total operational & financial expenses for a specific store within a date range.
 * Note: Operational expenses exclude Stock (Estoque) expenses since those are included in CMV.
 */
export function calculateStoreExpenses(
  rawExpenses: Expense[],
  financialTransactions: FinancialTransaction[],
  storeId: string,
  monthStart: string,
  monthEnd: string,
  expenseCategories: { id: string; name: string }[] = []
): {
  operational: number;
  financial: number;
  total: number;
  operationalBreakdown: ExpenseCategoryBreakdown[];
  financialBreakdown: ExpenseCategoryBreakdown[];
} {
  // Operational expenses breakdown (excluding Stock/Estoque)
  const opMap: Record<string, number> = {};
  rawExpenses
    .filter(e => {
      const eDate = e.date?.split('T')[0];
      const category = (e.category || '').toLowerCase();
      return (
        e.store_id === storeId &&
        eDate >= monthStart &&
        eDate <= monthEnd &&
        category !== 'stock' &&
        category !== 'estoque'
      );
    })
    .forEach(e => {
      let catName = e.category;
      if (!catName && e.category_id) {
        const found = expenseCategories.find(c => c.id === e.category_id);
        if (found) catName = found.name;
      }
      catName = catName?.trim() || 'Outras Despesas Operacionais';
      opMap[catName] = (opMap[catName] || 0) + Number(e.amount);
    });

  const operationalBreakdown: ExpenseCategoryBreakdown[] = Object.entries(opMap)
    .map(([categoryName, totalAmount]) => ({ categoryName, totalAmount }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const operational = operationalBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);

  // Financial expenses breakdown
  const finMap: Record<string, number> = {};
  financialTransactions
    .filter(t => {
      return (
        t.store_id === storeId &&
        t.type === 'expense' &&
        t.date >= monthStart &&
        t.date <= monthEnd
      );
    })
    .forEach(t => {
      let catName: string | undefined;
      if (t.expense_category_id) {
        const found = expenseCategories.find(c => c.id === t.expense_category_id);
        if (found) catName = found.name;
      }
      catName = catName?.trim() || 'Outras Despesas Financeiras';
      finMap[catName] = (finMap[catName] || 0) + Number(t.amount);
    });

  const financialBreakdown: ExpenseCategoryBreakdown[] = Object.entries(finMap)
    .map(([categoryName, totalAmount]) => ({ categoryName, totalAmount }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const financial = financialBreakdown.reduce((sum, item) => sum + item.totalAmount, 0);

  return {
    operational,
    financial,
    total: operational + financial,
    operationalBreakdown,
    financialBreakdown,
  };
}

/**
 * Maps POS payment methods to source IDs based on income source names.
 */
export function mapPaymentMethodToSourceId(sources: IncomeSource[]): Record<string, string> {
  const map: Record<string, string> = {};
  sources.forEach(source => {
    const name = source.name.toLowerCase();
    if (name === 'cash' || name === 'caixa') map['cash'] = source.id;
    else if (name === 'mpesa' || name === 'm-pesa') map['mpesa'] = source.id;
    else if (name === 'pos' || name === 'cartão' || name === 'cartao') {
      map['cartao'] = source.id;
      map['paga_facil'] = source.id;
    } else if (name === 'emola' || name === 'e-mola') map['emola'] = source.id;
  });
  return map;
}

/**
 * Calculates top selling categories and items for a specific store.
 */
export function calculateStorePerformanceAnalytics(
  transactions: Transaction[],
  transactionItems: TransactionItem[],
  dishes: Dish[],
  storeId: string,
  monthStart: string,
  monthEnd: string
): PerformanceAnalytics {
  const storeTxIds = new Set(
    transactions
      .filter(t => {
        const txDate = t.date?.split('T')[0];
        return t.store_id === storeId && txDate >= monthStart && txDate <= monthEnd;
      })
      .map(t => t.id)
  );

  const storeItems = transactionItems.filter(item => storeTxIds.has(item.transaction_id));

  const itemPerformance: Record<string, { revenue: number; quantity: number; name: string }> = {};
  const categoryPerformance: Record<string, { revenue: number; quantity: number }> = {};

  storeItems.forEach(item => {
    const dish = dishes.find(d => d.id === item.dish_id);
    const name = dish?.name || 'Unknown';
    const category = dish?.category || 'Uncategorized';
    const rev = Number(item.quantity) * Number(item.unit_price);
    const qty = Number(item.quantity);

    if (!itemPerformance[item.dish_id]) {
      itemPerformance[item.dish_id] = { revenue: 0, quantity: 0, name };
    }
    itemPerformance[item.dish_id].revenue += rev;
    itemPerformance[item.dish_id].quantity += qty;

    if (!categoryPerformance[category]) {
      categoryPerformance[category] = { revenue: 0, quantity: 0 };
    }
    categoryPerformance[category].revenue += rev;
    categoryPerformance[category].quantity += qty;
  });

  const topItems = Object.values(itemPerformance)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topCategories = Object.entries(categoryPerformance)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return { topCategories, topItems };
}

/**
 * Calculates low profit margin dishes based on ingredient costs + fixed costs vs price.
 */
export function calculateLowMarginItems(
  dishes: Dish[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  marginThresholdPercent: number
): LowMarginItem[] {
  const threshold = marginThresholdPercent / 100;
  return dishes
    .map(dish => {
      const dishRecipes = recipes.filter(r => r.dish_id === dish.id);
      const ingredientCost = dishRecipes.reduce((sum, r) => {
        const ingredient = ingredients.find(i => i.id === r.ingredient_id);
        return sum + Number(ingredient?.average_cost || 0) * Number(r.quantity_required);
      }, 0);

      const fixedCost = Number(dish.cost_of_production) || 0;
      const totalCost = ingredientCost + fixedCost;
      const price = Number(dish.selling_price) || 0;
      const margin = price > 0 ? (price - totalCost) / price : 0;

      return { ...dish, margin, totalCost };
    })
    .filter(item => item.margin <= threshold)
    .sort((a, b) => a.margin - b.margin);
}
