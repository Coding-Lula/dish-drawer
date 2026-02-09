export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      allocation_categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          percent: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          percent?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          percent?: number
        }
        Relationships: []
      }
      store_enabled_categories: {
        Row: {
          category: string
          created_at: string
          id: string
          store_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          store_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_enabled_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_components: {
        Row: {
          bundle_id: string
          created_at: string
          dish_id: string
          id: string
          is_required: boolean | null
          max_quantity: number | null
        }
        Insert: {
          bundle_id: string
          created_at?: string
          dish_id: string
          id?: string
          is_required?: boolean | null
          max_quantity?: number | null
        }
        Update: {
          bundle_id?: string
          created_at?: string
          dish_id?: string
          id?: string
          is_required?: boolean | null
          max_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_components_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "dish_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_components_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          created_at: string
          customer_name: string
          date: string
          id: string
          sale_amount: number
          settled_at: string | null
          status: string
          store_id: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          date?: string
          id?: string
          sale_amount: number
          settled_at?: string | null
          status?: string
          store_id: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          date?: string
          id?: string
          sale_amount?: number
          settled_at?: string | null
          status?: string
          store_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_summaries: {
        Row: {
          created_at: string
          date: string
          grand_total: number
          id: string
          misc_amount: number | null
          misc_percent: number | null
          net_profit: number | null
          net_profit_percent: number | null
          restock_amount: number | null
          restock_percent: number | null
          salary_amount: number | null
          salary_percent: number | null
          store_id: string
          tax_amount: number | null
          tax_percent: number | null
        }
        Insert: {
          created_at?: string
          date: string
          grand_total: number
          id?: string
          misc_amount?: number | null
          misc_percent?: number | null
          net_profit?: number | null
          net_profit_percent?: number | null
          restock_amount?: number | null
          restock_percent?: number | null
          salary_amount?: number | null
          salary_percent?: number | null
          store_id: string
          tax_amount?: number | null
          tax_percent?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          grand_total?: number
          id?: string
          misc_amount?: number | null
          misc_percent?: number | null
          net_profit?: number | null
          net_profit_percent?: number | null
          restock_amount?: number | null
          restock_percent?: number | null
          salary_amount?: number | null
          salary_percent?: number | null
          store_id?: string
          tax_amount?: number | null
          tax_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_summaries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_bundles: {
        Row: {
          category: string | null
          cost_of_production: number
          created_at: string
          default_price: number
          description: string | null
          id: string
          image: string | null
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          cost_of_production?: number
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          cost_of_production?: number
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          category: string | null
          cost_of_production: number | null
          created_at: string
          id: string
          image: string | null
          name: string
          selling_price: number
        }
        Insert: {
          category?: string | null
          cost_of_production?: number | null
          created_at?: string
          id?: string
          image?: string | null
          name: string
          selling_price: number
        }
        Update: {
          category?: string | null
          cost_of_production?: number | null
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          selling_price?: number
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_system: boolean | null
          monthly_budget: number | null
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_system?: boolean | null
          monthly_budget?: number | null
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_system?: boolean | null
          monthly_budget?: number | null
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_parent_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_parent_categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          ingredient_id: string | null
          ingredient_quantity: number | null
          invoice_no: string | null
          is_deducted: boolean | null
          is_iva_deductible: boolean | null
          payment_method: string | null
          staff_id: string | null
          store_id: string
          supplier_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          ingredient_id?: string | null
          ingredient_quantity?: number | null
          invoice_no?: string | null
          is_deducted?: boolean | null
          is_iva_deductible?: boolean | null
          payment_method?: string | null
          staff_id?: string | null
          store_id: string
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          ingredient_id?: string | null
          ingredient_quantity?: number | null
          invoice_no?: string | null
          is_deducted?: boolean | null
          is_iva_deductible?: boolean | null
          payment_method?: string | null
          staff_id?: string | null
          store_id?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          expense_category_id: string | null
          id: string
          invoice_no: string | null
          is_locked: boolean | null
          is_recurring: boolean | null
          locked_at: string | null
          source_id: string | null
          store_id: string
          supplier: string | null
          transfer_to_source_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          expense_category_id?: string | null
          id?: string
          invoice_no?: string | null
          is_locked?: boolean | null
          is_recurring?: boolean | null
          locked_at?: string | null
          source_id?: string | null
          store_id: string
          supplier?: string | null
          transfer_to_source_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          expense_category_id?: string | null
          id?: string
          invoice_no?: string | null
          is_locked?: boolean | null
          is_recurring?: boolean | null
          locked_at?: string | null
          source_id?: string | null
          store_id?: string
          supplier?: string | null
          transfer_to_source_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_transfer_to_source_id_fkey"
            columns: ["transfer_to_source_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      income_allocations: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          source_id: string
          store_id: string
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          source_id: string
          store_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          source_id?: string
          store_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_allocations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_allocations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_allocations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          color: string | null
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      ingredient_recipes: {
        Row: {
          created_at: string
          id: string
          processed_ingredient_id: string
          quantity_required: number
          raw_ingredient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_ingredient_id: string
          quantity_required: number
          raw_ingredient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_ingredient_id?: string
          quantity_required?: number
          raw_ingredient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_recipes_processed_ingredient_id_fkey"
            columns: ["processed_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_recipes_raw_ingredient_id_fkey"
            columns: ["raw_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          average_cost: number
          category: string | null
          created_at: string
          id: string
          is_processed: boolean | null
          name: string
          unit: string
        }
        Insert: {
          average_cost?: number
          category?: string | null
          created_at?: string
          id?: string
          is_processed?: boolean | null
          name: string
          unit?: string
        }
        Update: {
          average_cost?: number
          category?: string | null
          created_at?: string
          id?: string
          is_processed?: boolean | null
          name?: string
          unit?: string
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          change_amount: number
          created_at: string
          date: string
          id: string
          ingredient_id: string
          purchase_price: number | null
          reason: string
          store_id: string
          supplier_id: string | null
          unit_cost: number | null
        }
        Insert: {
          change_amount: number
          created_at?: string
          date?: string
          id?: string
          ingredient_id: string
          purchase_price?: number | null
          reason?: string
          store_id: string
          supplier_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          change_amount?: number
          created_at?: string
          date?: string
          id?: string
          ingredient_id?: string
          purchase_price?: number | null
          reason?: string
          store_id?: string
          supplier_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          created_at: string
          from_store_id: string
          id: string
          ingredient_id: string
          notes: string | null
          quantity: number
          to_store_id: string
          transferred_at: string
        }
        Insert: {
          created_at?: string
          from_store_id: string
          id?: string
          ingredient_id: string
          notes?: string | null
          quantity: number
          to_store_id: string
          transferred_at?: string
        }
        Update: {
          created_at?: string
          from_store_id?: string
          id?: string
          ingredient_id?: string
          notes?: string | null
          quantity?: number
          to_store_id?: string
          transferred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_from_store_id_fkey"
            columns: ["from_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_to_store_id_fkey"
            columns: ["to_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      month_locks: {
        Row: {
          created_at: string
          id: string
          locked_at: string
          locked_by: string | null
          month: number
          notes: string | null
          store_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          month: number
          notes?: string | null
          store_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          month?: number
          notes?: string | null
          store_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "month_locks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_budgets: {
        Row: {
          budget_amount: number
          created_at: string
          expense_category_id: string
          id: string
          month: number
          store_id: string
          year: number
        }
        Insert: {
          budget_amount?: number
          created_at?: string
          expense_category_id: string
          id?: string
          month: number
          store_id: string
          year: number
        }
        Update: {
          budget_amount?: number
          created_at?: string
          expense_category_id?: string
          id?: string
          month?: number
          store_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_budgets_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_budgets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      production_log_items: {
        Row: {
          created_at: string
          id: string
          production_log_id: string
          quantity_used: number
          raw_ingredient_id: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          production_log_id: string
          quantity_used: number
          raw_ingredient_id: string
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          production_log_id?: string
          quantity_used?: number
          raw_ingredient_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_log_items_production_log_id_fkey"
            columns: ["production_log_id"]
            isOneToOne: false
            referencedRelation: "production_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_log_items_raw_ingredient_id_fkey"
            columns: ["raw_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      production_logs: {
        Row: {
          created_at: string
          id: string
          processed_ingredient_id: string
          produced_at: string
          quantity_produced: number
          store_id: string
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          processed_ingredient_id: string
          produced_at?: string
          quantity_produced: number
          store_id: string
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          processed_ingredient_id?: string
          produced_at?: string
          quantity_produced?: number
          store_id?: string
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_processed_ingredient_id_fkey"
            columns: ["processed_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          ingredient_id: string
          quantity_required: number
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          ingredient_id: string
          quantity_required: number
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          ingredient_id?: string
          quantity_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          created_at: string
          id: string
          is_occupied: boolean | null
          name: string | null
          store_id: string
          table_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_occupied?: boolean | null
          name?: string | null
          store_id: string
          table_number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_occupied?: boolean | null
          name?: string | null
          store_id?: string
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      split_configs: {
        Row: {
          bank_percent: number
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          ops_percent: number
          restock_percent: number
          tax_percent: number
        }
        Insert: {
          bank_percent?: number
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          ops_percent?: number
          restock_percent?: number
          tax_percent?: number
        }
        Update: {
          bank_percent?: number
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          ops_percent?: number
          restock_percent?: number
          tax_percent?: number
        }
        Relationships: []
      }
      store_bundle_prices: {
        Row: {
          bundle_id: string
          created_at: string
          custom_price: number
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          custom_price: number
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          custom_price?: number
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_bundle_prices_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "dish_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_bundle_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_dish_prices: {
        Row: {
          created_at: string
          custom_price: number
          dish_id: string
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_price: number
          dish_id: string
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_price?: number
          dish_id?: string
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_dish_prices_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_dish_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_stock: {
        Row: {
          created_at: string
          current_quantity: number
          id: string
          ingredient_id: string
          min_threshold: number
          store_id: string
          target_stock: number
        }
        Insert: {
          created_at?: string
          current_quantity?: number
          id?: string
          ingredient_id: string
          min_threshold?: number
          store_id: string
          target_stock?: number
        }
        Update: {
          created_at?: string
          current_quantity?: number
          id?: string
          ingredient_id?: string
          min_threshold?: number
          store_id?: string
          target_stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_stock_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_stock_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          location: string | null
          manager_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          manager_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          manager_id?: string | null
          name?: string
        }
        Relationships: []
      }
      sub_recipe_items: {
        Row: {
          created_at: string
          id: string
          quantity_required: number
          raw_ingredient_id: string
          sub_recipe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity_required: number
          raw_ingredient_id: string
          sub_recipe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity_required?: number
          raw_ingredient_id?: string
          sub_recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_recipe_items_raw_ingredient_id_fkey"
            columns: ["raw_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_recipe_items_sub_recipe_id_fkey"
            columns: ["sub_recipe_id"]
            isOneToOne: false
            referencedRelation: "sub_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_recipe_outputs: {
        Row: {
          created_at: string
          id: string
          processed_ingredient_id: string
          quantity_produced: number
          sub_recipe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_ingredient_id: string
          quantity_produced?: number
          sub_recipe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_ingredient_id?: string
          quantity_produced?: number
          sub_recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_recipe_outputs_processed_ingredient_id_fkey"
            columns: ["processed_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_recipe_outputs_sub_recipe_id_fkey"
            columns: ["sub_recipe_id"]
            isOneToOne: false
            referencedRelation: "sub_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_recipes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string
          dish_id: string | null
          id: string
          quantity: number
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          dish_id?: string | null
          id?: string
          quantity: number
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          dish_id?: string | null
          id?: string
          quantity?: number
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          date: string
          id: string
          payment_method: string
          staff_id: string | null
          store_id: string
          table_id: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          payment_method: string
          staff_id?: string | null
          store_id: string
          table_id?: string | null
          total_amount: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          payment_method?: string
          staff_id?: string | null
          store_id?: string
          table_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_stores: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_store_access: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "cashier"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["manager", "cashier"],
    },
  },
} as const
