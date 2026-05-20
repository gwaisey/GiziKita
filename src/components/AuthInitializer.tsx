'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/js/store/authStore';

export default function AuthInitializer() {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return null;
}
