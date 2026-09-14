import type { Dish, Recipe } from '@/hooks/useSupabaseData';

export interface PosCartItem {
  dish: Dish;
  quantity: number;
  unitPrice: number;
  isBundle?: boolean;
  bundleId?: string;
  bundleDishId?: string;
  bundleName?: string;
  selectedDishIds?: string[];
}

export interface FormattedTransactionItem {
  dishId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Calculates aggregated ingredient deductions for cart items (including bundle sub-dishes).
 */
export function calculateCartIngredientDeductions(
  cartItems: PosCartItem[],
  recipes: Recipe[]
): Map<string, number> {
  const deductionMap = new Map<string, number>();

  for (const cartItem of cartItems) {
    if (cartItem.isBundle && cartItem.selectedDishIds) {
      for (const dishId of cartItem.selectedDishIds) {
        const dishRecipes = recipes.filter(r => r.dish_id === dishId);
        for (const recipe of dishRecipes) {
          const key = recipe.ingredient_id;
          deductionMap.set(
            key,
            (deductionMap.get(key) || 0) + Number(recipe.quantity_required) * cartItem.quantity
          );
        }
      }
    } else {
      const dishRecipes = recipes.filter(r => r.dish_id === cartItem.dish.id);
      for (const recipe of dishRecipes) {
        const key = recipe.ingredient_id;
        deductionMap.set(
          key,
          (deductionMap.get(key) || 0) + Number(recipe.quantity_required) * cartItem.quantity
        );
      }
    }
  }

  return deductionMap;
}

/**
 * Formats cart items for transaction insertion.
 * If isSelfConsumption is true, unit prices for all items are set to 0.
 */
export function formatTransactionItemsForCheckout(
  cartItems: PosCartItem[],
  isSelfConsumption: boolean = false
): FormattedTransactionItem[] {
  return cartItems.flatMap(item => {
    const mainUnitPrice = isSelfConsumption ? 0 : Number(item.unitPrice);
    const mainDishId = (item.isBundle ? item.bundleDishId : item.dish.id) || item.dish.id;

    const items: FormattedTransactionItem[] = [
      {
        dishId: mainDishId,
        quantity: item.quantity,
        unitPrice: mainUnitPrice,
      },
    ];

    // Add sub-items to transaction with 0 price for bundles
    if (item.isBundle && item.selectedDishIds) {
      item.selectedDishIds.forEach(id => {
        items.push({
          dishId: id,
          quantity: item.quantity,
          unitPrice: 0,
        });
      });
    }

    return items;
  });
}

/**
 * Calculates cart total considering optional discount and self-consumption logic.
 */
export function calculateCartTotal(
  rawTotal: number,
  isDiscountApplied: boolean,
  isSelfConsumption: boolean = false
): number {
  if (isSelfConsumption) {
    return 0;
  }
  return Math.max(0, rawTotal - (isDiscountApplied ? 5 : 0));
}
