import { useMemo } from "react";
import {
  LATIN_SQUARE,
  EASING_FUNCS,
  FIXED_TASKS_JA,
  FIXED_TASKS_EN,
} from "../utils/taskData";
import type { EasingFunction } from "../types/experiment";
import type { Lang } from "../utils/i18n";

// Phase 1用の旧タスク型
interface OldTask {
  category: string;
  subcat: string;
  item: string;
}

export function useLatinSquare(
  participantId: number,
  taskIndex: number,
  lang: Lang
) {
  return useMemo(() => {
    const FIXED_TASKS = lang === "en" ? FIXED_TASKS_EN : FIXED_TASKS_JA;

    const rowIndex = participantId % 5;
    const colIndex = (taskIndex - 1) % 5;

    const easingIndex = LATIN_SQUARE[rowIndex][colIndex];
    const taskDataIndex = LATIN_SQUARE[(rowIndex + 1) % 5][colIndex];

    const currentEasing = EASING_FUNCS[easingIndex] as EasingFunction;
    const currentTask: OldTask = FIXED_TASKS[taskDataIndex];

    return { currentEasing, currentTask };
  }, [participantId, taskIndex, lang]);
}
