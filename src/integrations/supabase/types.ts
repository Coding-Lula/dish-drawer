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
          id: string
          is_system: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean | null
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
          is_deducted: boolean | null
          staff_id: string | null
          store_id: string
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
          is_deducted?: boolean | null
          staff_id?: string | null
          store_id: string
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
          is_deducted?: boolean | null
          staff_id?: string | null
          store_id?: string
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
        ]
      }
      ingredients: {
        Row: {
          average_cost: number
          category: string | null
          created_at: string
          id: string
          name: string
          unit: string
        }
        Insert: {
          average_cost?: number
          category?: string | null
          created_at?: string
          id?: string
          name: string
          unit?: string
        }
        Update: {
          average_cost?: number
          category?: string | null
          created_at?: string
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
