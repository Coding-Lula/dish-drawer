import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useStores, type Store } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
}

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
}

const CurrentStoreContext = createContext<StoreContextType | null>(null);

export function useCurrentStore() {
  const context = useContext(CurrentStoreContext);
  if (!context) {
    throw new Error('useCurrentStore must be used within MainLayout');
  }
  return context;
}

export function MainLayout({ children, hideSidebar = false }: MainLayoutProps) {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const { stores } = useStores();
  const { hasGlobalAccess, accessibleStoreIds } = useAuth();

  // Filter stores based on user access
  const accessibleStores = hasGlobalAccess 
    ? stores 
    : stores.filter(s => accessibleStoreIds.includes(s.id));

  useEffect(() => {
    if (accessibleStores.length > 0 && !currentStore) {
      const storedStoreId = localStorage.getItem('currentStoreId');
      if (storedStoreId) {
        const storedStore = accessibleStores.find(s => s.id === storedStoreId);
        if (storedStore) {
          setCurrentStore(storedStore);
          return;
        }
      }
      // Default to first accessible store only if no stored preference
      setCurrentStore(accessibleStores[0]);
    }
    // If current store is not in accessible stores, reset
    if (currentStore && !accessibleStores.find(s => s.id === currentStore.id)) {
      if (accessibleStores.length > 0) {
        setCurrentStore(accessibleStores[0]);
      }
    }
  }, [accessibleStores, currentStore]);

  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('currentStoreId', currentStore.id);
    }
  }, [currentStore]);

  return (
    <CurrentStoreContext.Provider value={{ currentStore, setCurrentStore }}>
      <div className="min-h-screen bg-background">
        {!hideSidebar && <Sidebar currentStore={currentStore} onStoreChange={setCurrentStore} />}
        <main className={cn(
          "min-h-screen transition-all duration-300 p-3 md:p-6",
          !hideSidebar && "ml-64"
        )}>
          {children}
        </main>
      </div>
    </CurrentStoreContext.Provider>
  );
}
