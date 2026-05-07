import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  UtensilsCrossed,
  Receipt,
  Store,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Wallet,
  LogOut,
  Trash2,
  History,
  Users,
  UserCog
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NewStoreModal } from '@/components/modals/NewStoreModal';
import { useStores, type Store as StoreType } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager'] },
  { path: '/pos', label: 'Ponto de Venda', icon: ShoppingCart, roles: ['manager', 'cashier'] },
  { path: '/inventory', label: 'Inventário', icon: Package, roles: ['manager', 'cashier'] },
  { path: '/restock-history', label: 'Histórico Reposição', icon: History, roles: ['manager', 'cashier'] },
  { path: '/recipes', label: 'Folhas Técnicas', icon: UtensilsCrossed, roles: ['manager'] },
  { path: '/sub-recipes', label: 'Sub-Recipes', icon: UtensilsCrossed, roles: ['manager'] },
  { path: '/expenses', label: 'Despesas', icon: Receipt, roles: ['manager','cashier'] },
  { path: '/finance', label: 'Financeiro', icon: Wallet, roles: ['manager'] },
  { path: '/debtors', label: 'Devedores', icon: Users, roles: ['manager', 'cashier'] },
  { path: '/sales-report', label: 'Relatório de Vendas', icon: PieChart, roles: ['manager','cashier'] },
  { path: '/users', label: 'Utilizadores', icon: UserCog, roles: ['manager'] },
];

interface SidebarProps {
  currentStore: StoreType | null;
  onStoreChange: (store: StoreType) => void;
}

export function Sidebar({ currentStore, onStoreChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { stores, loading, addStore, deleteStore, refetch: refetchStores } = useStores();
  const { user, role, signOut, hasGlobalAccess, accessibleStoreIds } = useAuth();
  const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);

  // Filter stores based on user access
  const accessibleStores = hasGlobalAccess 
    ? stores 
    : stores.filter(s => accessibleStoreIds.includes(s.id));

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => 
    role && item.roles.includes(role)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    const success = await deleteStore(storeToDelete.id);
    if (success) {
      setStoreToDelete(null);
      // Switch to another store if available
      if (currentStore?.id === storeToDelete.id && stores.length > 1) {
        const otherStore = stores.find(s => s.id !== storeToDelete.id);
        if (otherStore) onStoreChange(otherStore);
      }
    }
  };

  // Get user initials
  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

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
              <span className="font-semibold text-foreground">Nexus POS</span>
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
            const store = accessibleStores.find(s => s.id === id);
            if (store) onStoreChange(store);
          }}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Selecionar loja" />
          </SelectTrigger>
          <SelectContent>
            {accessibleStores.map(store => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {role === 'manager' && (
          /* Updated container: flex, gap, and margin-top */
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1">
              <NewStoreModal onSubmit={addStore} />
            </div>
            
            {accessibleStores.length > 1 && currentStore && (
              <AlertDialog open={!!storeToDelete} onOpenChange={(open) => !open && setStoreToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={() => setStoreToDelete(currentStore)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                {/* ... (Keep your AlertDialogContent the same) */}
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar Loja</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja eliminar "{storeToDelete?.name}"? 
                      Esta ação irá remover todos os dados associados e não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setStoreToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive hover:bg-destructive/90">
                      Eliminar Loja
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
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

        {/* Footer with User Info */}
        
        {!collapsed && (
          
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{getInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}

        {/* Collapsed logout button */}
        {collapsed && (
          <div className="p-2 border-t border-border">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
