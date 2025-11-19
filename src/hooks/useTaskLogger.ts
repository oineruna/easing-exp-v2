import { useState, useRef, useCallback } from "react";
import type { ClickLog, Category } from "../types/experiment";

export function useTaskLogger() {
  const [clicksThisTask, setClicksThisTask] = useState<ClickLog[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [menuTravelDistance, setMenuTravelDistance] = useState(0);
  const [firstClickTime, setFirstClickTime] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickDepthRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  const getCategoryDepth = useCallback(
    (categories: Category[], targetName: string, depth = 0): number => {
      for (const cat of categories) {
        if (cat.name === targetName) {
          return depth;
        }
        if (cat.subcategories && cat.subcategories.length > 0) {
          const found = getCategoryDepth(
            cat.subcategories,
            targetName,
            depth + 1
          );
          if (found !== -1) return found;
        }
      }
      return -1;
    },
    []
  );

  const recordClick = useCallback(
    (categoryName: string, categories: Category[]) => {
      const currentClickTime = performance.now();
      const currentDepth = getCategoryDepth(categories, categoryName);

      // 初回クリック時間の記録
      if (firstClickTime === null) {
        const delay = (currentClickTime - startTimeRef.current) / 1000;
        setFirstClickTime(delay);
      }

      let stayTime = 0;
      if (lastClickTimeRef.current !== 0) {
        stayTime = (currentClickTime - lastClickTimeRef.current) / 1000;
      }

      const newClick: ClickLog = {
        step: clicksThisTask.length + 1,
        action: categoryName,
        depth: currentDepth,
        duringAnimation: isAnimatingRef.current,
        stayTime: parseFloat(stayTime.toFixed(2)),
        timestamp: new Date().toISOString(),
      };

      setClicksThisTask((prev) => [...prev, newClick]);
      setMenuTravelDistance(
        (prev) => prev + Math.abs(currentDepth - lastClickDepthRef.current)
      );

      lastClickTimeRef.current = currentClickTime;
      lastClickDepthRef.current = currentDepth;
    },
    [clicksThisTask.length, firstClickTime, getCategoryDepth]
  );

  const incrementError = useCallback(() => {
    setErrorCount((prev) => prev + 1);
  }, []);

  const resetTask = useCallback(() => {
    setClicksThisTask([]);
    setErrorCount(0);
    setMenuTravelDistance(0);
    setFirstClickTime(null);
    lastClickTimeRef.current = 0;
    lastClickDepthRef.current = 0;
    startTimeRef.current = performance.now();
  }, []);

  const setAnimating = useCallback((animating: boolean) => {
    isAnimatingRef.current = animating;
  }, []);

  return {
    clicksThisTask,
    errorCount,
    menuTravelDistance,
    firstClickTime,
    startTimeRef,
    recordClick,
    incrementError,
    resetTask,
    setAnimating,
  };
}
