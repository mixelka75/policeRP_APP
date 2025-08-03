// src/hooks/usePortal.ts
import { useEffect, useRef, useState } from 'react';

export const usePortal = (id?: string) => {
  const portalRef = useRef<HTMLElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const portalId = id || 'portal-root';
    console.log('usePortal: Setting up portal with id:', portalId);
    
    // Находим или создаем контейнер для портала
    let portalRoot = document.getElementById(portalId);
    
    if (!portalRoot) {
      console.log('usePortal: Creating new portal root');
      portalRoot = document.createElement('div');
      portalRoot.id = portalId;
      portalRoot.style.position = 'relative';
      portalRoot.style.zIndex = '9999';
      document.body.appendChild(portalRoot);
    }

    portalRef.current = portalRoot;
    setIsReady(true);
    console.log('usePortal: Portal ready, element:', portalRoot);

    return () => {
      console.log('usePortal: Cleanup');
      // Очищаем портал при размонтировании, если контейнер пуст
      const rootElement = document.getElementById(portalId);
      if (rootElement && rootElement.children.length === 0 && rootElement.parentNode) {
        rootElement.parentNode.removeChild(rootElement);
      }
      setIsReady(false);
    };
  }, [id]);

  // Возвращаем элемент только когда он готов
  return isReady ? portalRef.current : null;
};