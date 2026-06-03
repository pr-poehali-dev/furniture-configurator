import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { BACKEND } from '@/lib/backend';
import type { Product } from '@/data/catalog';

type ProductsCtx = {
  products: Product[];
  loading: boolean;
  error: string;
  reload: () => void;
};

const Ctx = createContext<ProductsCtx | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(BACKEND.products);
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <Ctx.Provider value={{ products, loading, error, reload }}>{children}</Ctx.Provider>;
}

export function useProducts(): ProductsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
