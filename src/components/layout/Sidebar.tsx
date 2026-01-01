import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  UtensilsCrossed,
  Receipt,
  Moon,
  Store,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Wallet
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { NewStoreModal } from '@/components/modals/NewStoreModal';
import { useStores, type Store as StoreType } from '@/hooks/useSupabaseData';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/recipes', label: 'Technical Sheets', icon: UtensilsCrossed },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/finance', label: 'Finance', icon: Wallet },
  { path: '/end-of-day', label: 'End of Day', icon: Moon },
  { path: '/revenue-allocation', label: 'Revenue Allocation', icon: PieChart },
];

interface SidebarProps {
  currentStore: StoreType | null;
  onStoreChange: (store: StoreType) => void;
}

export function Sidebar({ currentStore, onStoreChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { stores, loading, addStore } = useStores();

  useEffect(() => {
    if (!currentStore && stores.length > 0) {
      onStoreChange(stores[0]);
    }
  }, [stores, currentStore, onStoreChange]);

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">POS Control</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-muted/20 text-muted-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Store Selector */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Current Store
            </label>
            {loading ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : (
              <>
                <Select 
                  value={currentStore?.id || ''} 
                  onValueChange={(id) => {
                    const store = stores.find(s => s.id === id);
                    if (store) onStoreChange(store);
                  }}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <NewStoreModal onSubmit={addStore} />
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">MS</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Maria Santos</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
