// --- START OF FILE src/hooks/useTaskLogger.ts ---

import { useState, useRef, useCallback, useEffect } from "react";
import type { ClickLog, Category, TaskLog } from "./experiment"; // パスを修正

export function useTaskLogger() {
  const [clicksThisTask, setClicksThisTask] = useState<ClickLog[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [menuTravelDistance, setMenuTravelDistance] = useState(0);
  const [firstClickTime, setFirstClickTime] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickDepthRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  // マウス移動距離トラッキング用
  const mouseDistanceRef = useRef(0);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // グローバルマウス移動イベントリスナー
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (lastMousePosRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        mouseDistanceRef.current += distance;
      }
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // カテゴリの深さを取得
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

  // クリック記録
  const recordClick = useCallback(
    (categoryName: string, categories: Category[]) => {
      const currentClickTime = performance.now();
      const currentDepth = getCategoryDepth(categories, categoryName);

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
    // マウストラッキングをリセット
    mouseDistanceRef.current = 0;
    lastMousePosRef.current = null;
    startTimeRef.current = performance.now();
    isAnimatingRef.current = false;
  }, []);

  // ★ ログ確定用メソッド
  const stopTask = useCallback(
    (isCorrect: boolean, timedOut: boolean): Partial<TaskLog> => {
      const endTime = performance.now();
      const totalDurationMs = endTime - startTimeRef.current;

      return {
        isCorrect,
        timedOut,
        totalDuration: totalDurationMs,
        firstClickTime: firstClickTime || 0,
        clickCount: clicksThisTask.length,
        errorCount: errorCount,
        clicks: clicksThisTask,
        menuTravelDistance: menuTravelDistance,
        mouseDistance: Math.round(mouseDistanceRef.current), // マウス総移動距離（ピクセル、整数）
        interactedDuringAnimation: clicksThisTask.some(click => click.duringAnimation), // 🆕 アニメーション中のクリックがあったか
        animationClickCount: clicksThisTask.filter(click => click.duringAnimation).length, // 🆕 アニメーション中のクリック数
        animationErrorCount: clicksThisTask.filter(click => click.duringAnimation && click.isCorrect === false).length, // 🆕 アニメーション中の誤クリック数
      };
    },
    [clicksThisTask, errorCount, firstClickTime, menuTravelDistance]
  );

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
    stopTask,
    setAnimating,
  };
}
