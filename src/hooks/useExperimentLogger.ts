import { useState, useCallback, useRef } from "react";
import type {
  TaskLog,
  ClickRecord,
  EasingFunction,
  TaskDifficulty,
  PreferenceType,
  Category,
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

  const lastClickRef = useRef<string | null>(null);
  const lastClickDepthRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  /**
   * カテゴリーの深さを取得（既存のuseTaskLoggerから移植）
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
   * 新しいタスクを開始
   */
  const startTask = useCallback(
    (
      taskId: string,
      easingFunction: EasingFunction,
      difficulty: TaskDifficulty
    ) => {
      const newLog: TaskLog = {
        taskId,
        participantId,
        easingFunction,
        difficulty,
        preferenceType,
        startTime: Date.now(),
        firstClickTime: null,
        completionTime: null,
        totalDuration: null,
        clickSequence: [],
        totalClicks: 0,
        errorClicks: 0,
        backtrackCount: 0,
        singleEaseScore: null,
        isCompleted: false,
      };

      setCurrentTaskLog(newLog);
      lastClickRef.current = null;
    },
    [participantId, preferenceType]
  );

  /**
   * クリックを記録
   */
  const recordClick = useCallback(
    (itemName: string, depth: number, isCorrect: boolean) => {
      setCurrentTaskLog((prev) => {
        if (!prev) return prev;

        const now = Date.now();
        const isBacktrack = lastClickRef.current === itemName;

        const clickRecord: ClickRecord = {
          timestamp: now,
          itemName,
          depth,
          isCorrect,
          isBacktrack,
        };

        const newLog = {
          ...prev,
          firstClickTime: prev.firstClickTime || now,
          clickSequence: [...prev.clickSequence, clickRecord],
          totalClicks: prev.totalClicks + 1,
          errorClicks: prev.errorClicks + (isCorrect ? 0 : 1),
          backtrackCount: prev.backtrackCount + (isBacktrack ? 1 : 0),
        };

        lastClickRef.current = itemName;
        return newLog;
      });
    },
    []
  );

  /**
   * 初回クリックを記録
   */
  const recordFirstClick = useCallback(() => {
    setCurrentTaskLog((prev) => {
      if (!prev || prev.firstClickTime) return prev;
      return {
        ...prev,
        firstClickTime: Date.now(),
      };
    });
  }, []);

  /**
   * タスク完了
   */
  const completeTask = useCallback((isSuccess: boolean = true) => {
    setCurrentTaskLog((prev) => {
      if (!prev) return prev;

      const now = Date.now();
      const completedLog: TaskLog = {
        ...prev,
        completionTime: now,
        totalDuration: now - prev.startTime,
        isCompleted: isSuccess,
      };

      setAllTaskLogs((logs) => [...logs, completedLog]);
      return completedLog;
    });
  }, []);

  /**
   * SEQスコアを記録
   */
  const recordSEQ = useCallback((score: number) => {
    setCurrentTaskLog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        singleEaseScore: score,
      };
    });
  }, []);

  /**
   * 現在のタスクログをエクスポート
   */
  const exportCurrentLog = useCallback(() => {
    return currentTaskLog;
  }, [currentTaskLog]);

  /**
   * 全タスクログをエクスポート
   */
  const exportAllLogs = useCallback(() => {
    return allTaskLogs;
  }, [allTaskLogs]);

  /**
   * ログをリセット（新しい参加者用）
   */
  const resetLogs = useCallback(() => {
    setCurrentTaskLog(null);
    setAllTaskLogs([]);
    lastClickRef.current = null;
  }, []);

  /**
   * タスクの統計情報を計算
   */
  const getTaskStats = useCallback(() => {
    if (!currentTaskLog) return null;

    const firstClickDelay = currentTaskLog.firstClickTime
      ? currentTaskLog.firstClickTime - currentTaskLog.startTime
      : null;

    const averageClickInterval =
      currentTaskLog.clickSequence.length > 1
        ? (currentTaskLog.totalDuration || 0) /
          currentTaskLog.clickSequence.length
        : null;

    return {
      firstClickDelay,
      averageClickInterval,
      errorRate:
        currentTaskLog.totalClicks > 0
          ? currentTaskLog.errorClicks / currentTaskLog.totalClicks
          : 0,
      efficiency:
        currentTaskLog.clickSequence.filter((c) => c.isCorrect).length /
        (currentTaskLog.totalClicks || 1),
    };
  }, [currentTaskLog]);

  return {
    // 状態
    currentTaskLog,
    allTaskLogs,

    // アクション
    startTask,
    recordClick,
    recordFirstClick,
    completeTask,
    recordSEQ,

    // エクスポート
    exportCurrentLog,
    exportAllLogs,
    resetLogs,

    // 統計
    getTaskStats,
  };
}
