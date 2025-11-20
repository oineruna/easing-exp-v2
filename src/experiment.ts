// --- START OF FILE src/experiment.ts ---

/**
 * 言語型 (i18n用)
 */
export type Lang = "ja" | "en";

/**
 * メニューのカテゴリ構造定義
 */
export type Category = {
  name: string;
  subcategories?: Category[];
};

/**
 * 実験で使用するイージング関数の種類
 */
export type EasingFunction =
  | "linear"
  | "easeInOutQuad"
  | "easeInOutQuint"
  | "easeInOutExpo"
  | "easeInOutBack";

/**
 * タスク定義
 */
export interface Task {
  id: string;
  description: string;
  targetPath: string[];
}

/**
 * クリックイベントの詳細ログ
 */
export interface ClickRecord {
  step: number;
  action: string;
  depth: number;
  duringAnimation: boolean;
  stayTime: number;
  timestamp: string;
  isCorrect?: boolean;
  x?: number;
  y?: number;
}

export type ClickLog = ClickRecord;

/**
 * タスク終了後のアンケート結果
 */
export interface TaskSurveyResult {
  easeRating: number;
  difficultyRating: number;
  differenceRating: number;
  comments: string;
}

/**
 * 1タスクごとの実験記録（ログ）
 */
export interface TaskLog {
  participantId: string;
  trialNumber: number;
  taskId: string;
  targetItem: string;
  easingFunction: EasingFunction;
  isCorrect: boolean;
  timedOut: boolean;
  startTime?: number;
  endTime?: number;
  totalDuration: number;
  totalTime?: string;
  firstClickTime?: number;
  clickCount: number;
  errorCount: number;
  totalClicks?: number;
  errorClicks?: number;
  clicks: ClickRecord[];
  menuTravelDistance?: number;
  survey?: TaskSurveyResult;
  seqScore?: number;
  usedEasing?: EasingFunction;
}

/**
 * 事後アンケート結果の型
 * ★ inputDevice を削除し、worstFeature を追加
 */
export interface PostSurveyResult {
  participantId: string;
  noticeDifference: string;
  usabilityImpact: string[];
  usabilityImpactOther: string;
  bestFeature: string;
  worstFeature: string; // ★ 追加
  // inputDevice: string;    // 🗑️ 削除
  improvements: string;
}

/**
 * 実験全体のデータ構造
 */
export interface ExperimentData {
  participantId: string;
  timestamp: string;
  tasks: TaskLog[];
  postSurvey: PostSurveyResult;
}
