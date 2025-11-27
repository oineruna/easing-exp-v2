// --- START OF FILE src/hooks/useTaskLogger.ts ---

import { useState, useRef, useCallback, useEffect } from "react";
import type { ClickLog, Category, TaskLog } from "./experiment"; // パスを修正

/**
 * タスク実行中のログ記録を行うカスタムフック
 * クリック、マウス移動、エラー、時間などを管理します
 */
export function useTaskLogger() {
  // --- State Variables (Reactの状態管理) ---

  // 現在のタスク内でのクリック履歴
  const [clicksThisTask, setClicksThisTask] = useState<ClickLog[]>([]);

  // 誤クリック（エラー）の回数
  const [errorCount, setErrorCount] = useState(0);

  // メニュー階層の移動距離（深さの変化の総和）
  const [menuTravelDistance, setMenuTravelDistance] = useState(0);

  // 最初のクリックまでの時間（反応時間）
  const [firstClickTime, setFirstClickTime] = useState<number | null>(null);

  // --- Refs (レンダリングを発生させない可変値) ---

  // タスク開始時刻（performance.now()）
  const startTimeRef = useRef<number>(0);

  // 直前のクリック時刻（滞在時間計算用）
  const lastClickTimeRef = useRef<number>(0);

  // 直前のクリック深さ（移動距離計算用）
  const lastClickDepthRef = useRef<number>(0);

  // 現在アニメーション中かどうかのフラグ
  const isAnimatingRef = useRef<boolean>(false);

  // マウス移動距離トラッキング用
  const mouseDistanceRef = useRef(0);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // --- Effects ---

  /**
   * グローバルマウス移動イベントリスナー
   * タスク中の総マウス移動距離を計算します
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (lastMousePosRef.current) {
        // 直前の位置とのユークリッド距離を計算して加算
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        mouseDistanceRef.current += distance;
      }
      // 現在位置を更新
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // --- Helper Functions ---

  /**
   * カテゴリツリー内でのターゲットの深さを再帰的に検索して取得
   * @param categories 検索対象のカテゴリリスト
   * @param targetName 探しているカテゴリ名
   * @param depth 現在の深さ（再帰用）
   * @returns 深さ（見つからない場合は-1）
   */
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

  // --- Main Functions ---

  /**
   * クリックイベントを記録する関数
   * @param categoryName クリックされたカテゴリ名
   * @param categories 現在のカテゴリ構造（深さ計算用）
   */
  const recordClick = useCallback(
    (categoryName: string, categories: Category[]) => {
      const currentClickTime = performance.now();
      const currentDepth = getCategoryDepth(categories, categoryName);

      // 初回クリック時間の記録
      if (firstClickTime === null) {
        const delay = (currentClickTime - startTimeRef.current) / 1000;
        setFirstClickTime(delay);
      }

      // 滞在時間（前のクリックからの経過時間）の計算
      let stayTime = 0;
      if (lastClickTimeRef.current !== 0) {
        stayTime = (currentClickTime - lastClickTimeRef.current) / 1000;
      }

      // 新しいクリックログオブジェクトの作成
      const newClick: ClickLog = {
        step: clicksThisTask.length + 1,
        action: categoryName,
        depth: currentDepth,
        duringAnimation: isAnimatingRef.current, // アニメーション中のクリックか記録
        stayTime: parseFloat(stayTime.toFixed(2)),
        timestamp: new Date().toISOString(),
      };

      // 状態更新
      setClicksThisTask((prev) => [...prev, newClick]);
      setMenuTravelDistance(
        (prev) => prev + Math.abs(currentDepth - lastClickDepthRef.current)
      );

      // 参照更新
      lastClickTimeRef.current = currentClickTime;
      lastClickDepthRef.current = currentDepth;
    },
    [clicksThisTask.length, firstClickTime, getCategoryDepth]
  );

  /**
   * エラーカウントをインクリメントする関数
   * 誤ったアイテムをクリックした際に呼び出されます
   */
  const incrementError = useCallback(() => {
    setErrorCount((prev) => prev + 1);
  }, []);

  /**
   * タスクの状態をリセットする関数
   * 次のタスクを開始する前に呼び出されます
   */
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

    // 開始時刻をリセット
    startTimeRef.current = performance.now();
    isAnimatingRef.current = false;
  }, []);

  /**
   * タスク終了時にログを確定して返す関数
   * @param isCorrect 正解したかどうか
   * @param timedOut 時間切れかどうか
   * @returns 記録されたTaskLogの一部
   */
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

        // アニメーション関連の集計
        interactedDuringAnimation: clicksThisTask.some(click => click.duringAnimation), // アニメーション中に操作したか
        animationClickCount: clicksThisTask.filter(click => click.duringAnimation).length, // アニメーション中のクリック数
        animationErrorCount: clicksThisTask.filter(click => click.duringAnimation && click.isCorrect === false).length, // アニメーション中の誤クリック数
      };
    },
    [clicksThisTask, errorCount, firstClickTime, menuTravelDistance]
  );

  /**
   * アニメーション状態を更新する関数
   * @param animating アニメーション中かどうか
   */
  const setAnimating = useCallback((animating: boolean) => {
    isAnimatingRef.current = animating;
  }, []);

  // フックの戻り値
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
