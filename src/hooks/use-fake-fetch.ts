"use client";

import { useCallback, useEffect, useState } from "react";
import { fakeFetch } from "@/lib/fake-fetch";

export function useFakeFetch<T>(source: T, delayMs = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);

    fakeFetch(source, delayMs).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [source, delayMs, tick]);

  const refetch = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  return { data, loading, refetch };
}
