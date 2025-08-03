import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollProps<T> {
  fetchData: (page: number, pageSize: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }>;
  pageSize?: number;
  threshold?: number;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
  totalCount: number;
}

export function useInfiniteScroll<T>({
  fetchData,
  pageSize = 20,
  threshold = 100
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const loadingRef = useRef(false);

  const loadData = useCallback(async (page: number, isInitial = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    
    try {
      if (isInitial) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const result = await fetchData(page, pageSize);
      
      if (isInitial) {
        setData(result.data);
        setCurrentPage(0);
      } else {
        setData(prev => [...prev, ...result.data]);
        setCurrentPage(page);
      }
      
      setHasMore(result.pagination.has_next);
      setTotalCount(result.pagination.total_count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [fetchData, pageSize]);

  const refresh = useCallback(() => {
    setData([]);
    setCurrentPage(0);
    setHasMore(true);
    setTotalCount(0);
    loadData(0, true);
  }, [loadData]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    loadData(currentPage + 1, false);
  }, [hasMore, isLoadingMore, isLoading, currentPage, loadData]);

  // Auto scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoadingMore || isLoading) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, isLoading, loadMore, threshold]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    totalCount
  };
}