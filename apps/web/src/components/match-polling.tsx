'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MatchPollingProps {
  matchStatus: string;
  intervalMs?: number;
}

export function MatchPolling({ matchStatus, intervalMs = 10000 }: MatchPollingProps) {
  const router = useRouter();

  useEffect(() => {
    if (matchStatus !== 'live') return;

    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [matchStatus, router, intervalMs]);

  return null;
}
