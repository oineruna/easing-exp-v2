// useExperimentLogger.ts

import { useState, useCallback, useRef } from "react";
import type {
  TaskLog,
  ClickRecord,
  EasingFunction,
  // ❌ 削除: TaskDifficulty,
  PreferenceType,
  Category,
  ExperimentSession,
  EasingEvaluation,
  NASATLXScore,
} from "../types/experiment";

interface UseExperimentLoggerProps {
  participantId: string;
  preferenceType: PreferenceType;
}

export function useExperimentLogger({
  participantId,
  preferenceType,
}: UseExperimentLoggerProps) {
  const [currentTaskLog, setCurrentTaskLog] = useState<TaskLog | null>(null);
  const [allTaskLogs, setAllTaskLogs] = useState<TaskLog[]>([]);
  const [menuTravelDistance, setMenuTravelDistance] = useState(0);

  // ログ記録用のRef
  const lastClickRef = useRef<string | null>(null);
  const lastClickDepthRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0); // performance.now() の値
  const isAnimatingRef = useRef<boolean>(false);

  // === ヘルパー関数 ===

  /**
   * カテゴリーの深さを取得（メニューの階層レベル）
   * @param categories - 現在のカテゴリーリスト
   * @param targetName - 検索対象のカテゴリー名
   * @param depth - 現在の階層（0始まり）
   * @returns 見つかった場合の深さ、見つからなかった場合は -1
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

  /**
   * タスク開始時の状態を初期化
   * @param taskId - タスクID
   * @param easingFunction - 使用するイージング関数
   */
  const startNewTask = useCallback(
    (
      taskId: string,
      easingFunction: EasingFunction
      // ❌ difficulty 引数を削除
    ) => {
      // 既存のログを TaskLog の配列に移動（もし残っていれば）
      if (currentTaskLog) {
        setAllTaskLogs((prev) => [...prev, currentTaskLog]);
      }

      const newTaskLog: TaskLog = {
        taskId,
        participantId,
        easingFunction,
        // ❌ difficulty プロパティを削除

        // PreferenceTypeは実験を通して固定
        preferenceType,

        startTime: performance.now(),
        firstClickTime: null,
        completionTime: null,
        totalDuration: null,

        clickSequence: [],
        totalClicks: 0,
        errorClicks: 0,
        backtrackCount: 0,

        singleEaseScore: null,
        isCompleted: false,

        // Phase 1 互換性用プロパティを初期化
        totalTime: undefined,
        clicks: undefined,
        menuTravelDistance: undefined,
        errorCount: undefined,
        timedOut: undefined,
        usedEasing: undefined,
      };

      setCurrentTaskLog(newTaskLog);

      // Refの初期化
      lastClickRef.current = null;
      lastClickDepthRef.current = 0;
      lastClickTimeRef.current = 0;
      isAnimatingRef.current = false;
      setMenuTravelDistance(0); // タスクメニューの移動距離もリセット
    },
    [currentTaskLog, participantId, preferenceType]
  );

  /**
   * クリックイベントを記録
   * @param categoryName - クリックされたカテゴリー名
   * @param categories - 現在のメニュー構造
   * @param correctPath - 正解のパス
   */
  const recordClick = useCallback(
    (
      categoryName: string,
      categories: Category[],
      correctPath: string[]
    ): boolean => {
      if (!currentTaskLog) return false;

      const currentClickTime = performance.now();
      const currentDepth = getCategoryDepth(categories, categoryName);
      const isCorrectClick = correctPath[currentDepth] === categoryName;
      const isFinalClick =
        isCorrectClick && currentDepth === correctPath.length - 1;
      const isBacktrack = currentDepth < lastClickDepthRef.current; // 戻る操作

      const prevTime = lastClickTimeRef.current || currentTaskLog.startTime;
      const stayTime = (currentClickTime - prevTime) / 1000;

      // 初回クリック時間の記録
      if (currentTaskLog.firstClickTime === null) {
        // startTimeからの差分を記録
        const firstClickDelay = currentClickTime - currentTaskLog.startTime;
        setCurrentTaskLog((prev) =>
          prev ? { ...prev, firstClickTime: firstClickDelay } : null
        );
      }

      const newClick: ClickRecord = {
        timestamp: currentClickTime,
        itemName: categoryName,
        depth: currentDepth,
        isCorrect: isCorrectClick,
        isBacktrack: isBacktrack,
        duringAnimation: isAnimatingRef.current,
        stayTime: parseFloat(stayTime.toFixed(3)),
      };

      setCurrentTaskLog((prev) => {
        if (!prev) return null;

        const newTotalClicks = prev.totalClicks + 1;
        const newErrorClicks = isCorrectClick
          ? prev.errorClicks
          : prev.errorClicks + 1;
        const newBacktrackCount = isBacktrack
          ? prev.backtrackCount + 1
          : prev.backtrackCount;

        return {
          ...prev,
          clickSequence: [...prev.clickSequence, newClick],
          totalClicks: newTotalClicks,
          errorClicks: newErrorClicks,
          backtrackCount: newBacktrackCount,
        };
      });

      // メニュー移動距離の更新 (絶対距離)
      setMenuTravelDistance(
        (prev) => prev + Math.abs(currentDepth - lastClickDepthRef.current)
      );

      // Refの更新
      lastClickRef.current = categoryName;
      lastClickDepthRef.current = currentDepth;
      lastClickTimeRef.current = currentClickTime;

      return isFinalClick;
    },
    [currentTaskLog, getCategoryDepth]
  );

  /**
   * タスク完了時またはタイムアウト時にログを確定
   */
  const completeTask = useCallback(
    (isCompleted: boolean, singleEaseScore: number | null) => {
      setCurrentTaskLog((prev) => {
        if (!prev) return null;

        const completionTime = performance.now();
        const totalDuration = completionTime - prev.startTime;

        // Phase 1 互換性データを作成 (必要な場合のみ)
        const clicksPhase1 = prev.clickSequence.map((c, index) => ({
          step: index + 1,
          action: c.itemName,
          depth: c.depth,
          duringAnimation: c.duringAnimation,
          stayTime: c.stayTime,
          timestamp: new Date(c.timestamp).toISOString(),
        }));
        const totalTimePhase1 = (totalDuration / 1000).toFixed(2);

        return {
          ...prev,
          completionTime,
          totalDuration,
          isCompleted,
          singleEaseScore,

          // Phase 1 互換性用プロパティをセット
          totalTime: totalTimePhase1,
          clicks: clicksPhase1,
          menuTravelDistance: menuTravelDistance,
          errorCount: prev.errorClicks,
          timedOut: !isCompleted, // 完了しなかった = タイムアウトと見なす
          usedEasing: prev.easingFunction,
        };
      });
      // TaskMenu の移動距離は次のタスク開始時にリセットされる
    },
    [menuTravelDistance]
  );

  /**
   * 確定したタスクログを全ログリストに追加
   */
  const saveCurrentTaskLog = useCallback(() => {
    if (currentTaskLog) {
      setAllTaskLogs((prev) => [...prev, currentTaskLog]);
      setCurrentTaskLog(null);
    }
  }, [currentTaskLog]);

  /**
   * アニメーション状態の追跡
   */
  const setAnimating = useCallback((animating: boolean) => {
    isAnimatingRef.current = animating;
  }, []);

  /**
   * 最終的な ExperimentSession データを作成
   */
  const generateFinalSession = useCallback(
    (
      preSurveyData: any, // PreSurveyOverlayから渡されるデータ
      easingEvaluations: EasingEvaluation[],
      nasaTLX: NASATLXScore,
      postComments: string
    ): ExperimentSession => {
      // 最後に currentTaskLog に残っているデータがあれば、allTaskLogsに移動させる
      const finalTaskLogs = currentTaskLog
        ? [...allTaskLogs, currentTaskLog]
        : allTaskLogs;

      return {
        participantId,
        preferenceType,
        startTime: finalTaskLogs[0]?.startTime ?? Date.now(), // 最初のタスクログの開始時間を設定
        endTime: Date.now(),

        preSurvey: {
          preferences: preSurveyData.preferences,
          ranking: preSurveyData.ranking,
          comments: preSurveyData.comments,
        },

        taskLogs: finalTaskLogs,

        easingEvaluations,
        nasaTLX,
        postComments,
      };
    },
    [participantId, preferenceType, allTaskLogs, currentTaskLog]
  );

  /**
   * ログをリセット（新しい参加者用）
   */
  const resetLogs = useCallback(() => {
    setCurrentTaskLog(null);
    setAllTaskLogs([]);
    setMenuTravelDistance(0);
    lastClickRef.current = null;
    lastClickDepthRef.current = 0;
    lastClickTimeRef.current = 0;
    isAnimatingRef.current = false;
  }, []);

  return {
    // 状態
    currentTaskLog,
    allTaskLogs,

    // アクション
    startNewTask,
    recordClick,
    completeTask,
    saveCurrentTaskLog,
    setAnimating,
    generateFinalSession,
    resetLogs,
  };
}
