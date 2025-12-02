// --- START OF FILE src/hooks/useTaskLogger.ts ---

import { useState, useRef, useCallback, useEffect } from "react";
import type { ClickLog, Category, TaskLog, MouseTrajectoryPoint } from "./experiment"; // パスを修正

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

  // 訪問済みカテゴリ（誤答時のみ記録、再訪問判定用）
  const [visitedCategories, setVisitedCategories] = useState<Set<string>>(new Set());

  // フラストレーション回数（連打など）
  const [frustrationCount, setFrustrationCount] = useState(0);

  // マウス軌跡データ
  const [mouseTrajectory, setMouseTrajectory] = useState<MouseTrajectoryPoint[]>([]);

  // --- Refs (レンダリングを発生させない可変値) ---

  // タスク開始時刻（performance.now()）
  const startTimeRef = useRef<number>(0);

  // 直前のクリック時刻（滞在時間計算用）
  const lastClickTimeRef = useRef<number>(0);

  // 直前のクリック深さ（移動距離計算用）
  const lastClickDepthRef = useRef<number>(0);

  // 現在アニメーション中かどうかのフラグ
  const isAnimatingRef = useRef<boolean>(false);
  // アニメーション開始時刻
  const animationStartTimeRef = useRef<number>(0);

  // マウス移動距離トラッキング用
  const mouseDistanceRef = useRef(0);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  // マウスサンプリング用
  const lastSampleTimeRef = useRef<number>(0);

  // --- Effects ---

  /**
   * グローバルマウス移動イベントリスナー
   * タスク中の総マウス移動距離を計算します
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = performance.now();
      
      // 距離計算（全フレームで計算）
      if (lastMousePosRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        mouseDistanceRef.current += distance;
      }
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      // 軌跡記録（スロットリング: 16ms = 約60fps）
      if (currentTime - lastSampleTimeRef.current >= 16) {
        setMouseTrajectory(prev => [
          ...prev,
          {
            x: e.clientX,
            y: e.clientY,
            timestamp: currentTime,
            duringAnimation: isAnimatingRef.current
          }
        ]);
        lastSampleTimeRef.current = currentTime;
      }
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
      // 状態更新
      setClicksThisTask((prev) => [...prev, newClick]);
      setMenuTravelDistance(
        (prev) => prev + Math.abs(currentDepth - lastClickDepthRef.current)
      );

      // 参照更新
      lastClickTimeRef.current = currentClickTime;
      lastClickDepthRef.current = currentDepth;

      // フラストレーション判定 (500ms以内の連打)
      if (stayTime > 0 && stayTime < 0.5) {
        setFrustrationCount(prev => prev + 1);
      }
    },
    [clicksThisTask.length, firstClickTime, getCategoryDepth]
  );

  /**
   * エラーカウントをインクリメントする関数
   * 誤ったアイテムをクリックした際に呼び出されます
   * @param categoryName クリックしたカテゴリ名
   * @param depth クリックした階層の深さ
   * @param isLeaf 末端アイテムかどうか
   */
  const handleWrongClick = useCallback((categoryName: string, depth: number, isLeaf: boolean) => {
    // Depth 0 (トップレベル) はエラーカウントしない（安全地帯）
    if (depth < 1) return;

    let errorIncrement = 0;

    if (isLeaf) {
      // 末端（行き止まり）の間違いは重いペナルティ
      errorIncrement = 3;
    } else {
      // 中間カテゴリの間違い
      if (visitedCategories.has(categoryName)) {
        // 再訪問（以前にも間違えた場所）はペナルティ増
        errorIncrement = 2;
      } else {
        // 初回の間違い
        errorIncrement = 1;
        setVisitedCategories(prev => new Set(prev).add(categoryName));
      }
    }

    if (errorIncrement > 0) {
      setErrorCount((prev) => prev + errorIncrement);
    }
  }, [visitedCategories]);

  // 古い関数（互換性のため残すが、基本は handleWrongClick を使う）
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
    
    // 新しい状態のリセット
    setVisitedCategories(new Set());
    setFrustrationCount(0);
    setMouseTrajectory([]);
    lastSampleTimeRef.current = 0;
  }, []);

  /**
   * タスク終了時にログを確定して返す関数
   * @param isCorrect 正解したかどうか
   * @param timedOut 時間切れかどうか
   * @returns 記録されたTaskLogの一部
   */
  const stopTask = useCallback(
    (isCorrect: boolean, timedOut: boolean, correctPathLength: number = 0): Partial<TaskLog> => {
      const endTime = performance.now();
      const totalDurationMs = endTime - startTimeRef.current;

      // Jitteriness (ふらつき) の計算
      // 連続する3点の角度変化の総和
      let jitteriness = 0;
      if (mouseTrajectory.length >= 3) {
        for (let i = 2; i < mouseTrajectory.length; i++) {
          const p1 = mouseTrajectory[i - 2];
          const p2 = mouseTrajectory[i - 1];
          const p3 = mouseTrajectory[i];

          const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
          
          // 角度差を -PI ~ PI に正規化
          let diff = angle2 - angle1;
          while (diff <= -Math.PI) diff += 2 * Math.PI;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          
          jitteriness += Math.abs(diff);
        }
      }

      // Overshoot (オーバーシュート) の計算
      // クリック位置（ターゲット）を行き過ぎて戻る動作を検出
      let overshootCount = 0;
      // 各クリックについて判定
      clicksThisTask.forEach(click => {
        // クリック直前500msの軌跡を抽出
        const relevantPoints = mouseTrajectory.filter(p => 
          p.timestamp <= click.timestamp && p.timestamp >= click.timestamp - 500
        );
        
        if (relevantPoints.length < 5) return;

        // Y軸方向の動きを分析（縦長メニューなので）
        const clickY = relevantPoints[relevantPoints.length - 1].y; // クリック時のY座標と仮定
        const minY = Math.min(...relevantPoints.map(p => p.y));
        const maxY = Math.max(...relevantPoints.map(p => p.y));
        const startY = relevantPoints[0].y;

        const threshold = 20; // 20px以上の行き過ぎを検出

        // 下方向への移動だった場合
        if (clickY > startY) {
          if (maxY > clickY + threshold) {
            overshootCount++;
          }
        }
        // 上方向への移動だった場合
        else if (clickY < startY) {
          if (minY < clickY - threshold) {
            overshootCount++;
          }
        }
      });

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

        // 新しい指標
        frustrationCount: frustrationCount,
        clickEfficiency: correctPathLength > 0 && clicksThisTask.length > 0 
          ? parseFloat((correctPathLength / clicksThisTask.length).toFixed(3)) 
          : 0,
        
        // マウス軌跡・詳細指標
        // mouseTrajectory: mouseTrajectory, // 削除
        jitteriness: parseFloat(jitteriness.toFixed(3)),
        overshootCount: overshootCount,
      };
    },
    [clicksThisTask, errorCount, firstClickTime, menuTravelDistance, frustrationCount, mouseTrajectory]
  );

  /**
   * アニメーション状態を更新する関数
   * @param animating アニメーション中かどうか
   */
  const setAnimating = useCallback((isAnim: boolean) => {
    isAnimatingRef.current = isAnim;
    if (isAnim) {
      animationStartTimeRef.current = performance.now();
    }
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
    handleWrongClick,
    resetTask,
    stopTask,
    setAnimating,
  };
}
