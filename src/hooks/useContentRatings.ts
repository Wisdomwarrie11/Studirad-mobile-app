import { useState, useEffect } from 'react';
import { RatableContentType } from '../types';
import { RatingSummary, subscribeContentRatings } from '../services/firebaseDataService';

type RatingsMap = Record<string, RatingSummary>;

let cachedRatings: RatingsMap = {};
const listeners = new Set<(map: RatingsMap) => void>();
let activeUnsub: (() => void) | null = null;

function ensureSubscription() {
  if (!activeUnsub) {
    activeUnsub = subscribeContentRatings((map) => {
      cachedRatings = map;
      listeners.forEach((cb) => cb(cachedRatings));
    });
  }
}

export function useContentRatingsMap(): RatingsMap {
  const [ratingsMap, setRatingsMap] = useState<RatingsMap>(cachedRatings);

  useEffect(() => {
    ensureSubscription();
    const listener = (next: RatingsMap) => setRatingsMap(next);
    listeners.add(listener);
    if (Object.keys(cachedRatings).length > 0) {
      setRatingsMap(cachedRatings);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && activeUnsub) {
        activeUnsub();
        activeUnsub = null;
      }
    };
  }, []);

  return ratingsMap;
}

export function useContentRatingSummary(
  itemType: RatableContentType,
  itemId: string
): RatingSummary {
  const map = useContentRatingsMap();
  const key = `${itemType}_${itemId}`;
  return map[key] || { average: 0, count: 0, userRatings: {} };
}
