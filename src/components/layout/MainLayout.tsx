import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useStores, type Store } from '@/hooks/useSupabaseData';

interface MainLayoutProps {
  children: ReactNode;
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

export function MainLayout({ children }: MainLayoutProps) {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const { stores } = useStores();

  useEffect(() => {
    if (stores.length > 0) {
      const storedStoreId = localStorage.getItem('currentStoreId');
      if (storedStoreId) {
        const storedStore = stores.find(s => s.id === storedStoreId);
        if (storedStore) {
          setCurrentStore(storedStore);
          return;
        }
      }
      if (!currentStore) {
        setCurrentStore(stores[0]);
      }
    }
  }, [stores, currentStore]);

  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('currentStoreId', currentStore.id);
    }
  }, [currentStore]);

  return (
    <CurrentStoreContext.Provider value={{ currentStore, setCurrentStore }}>
      <div className="min-h-screen bg-background">
        <Sidebar currentStore={currentStore} onStoreChange={setCurrentStore} />
        <main className={cn("min-h-screen transition-all duration-300 ml-64 p-6")}>
          {children}
        </main>
      </div>
    </CurrentStoreContext.Provider>
  );
}
