// --- START OF FILE src/types/experiment.ts ---

// ... (既存の型定義はそのまま維持) ...

/**
 * 言語型 (i18n用)
 */
export type Lang = "ja" | "en";

export type Category = {
  name: string;
  subcategories?: Category[];
};

export type EasingFunction =
  | "linear"
  | "easeInOutQuad"
  | "easeInOutQuint"
  | "easeInOutExpo"
  | "easeInOutBack";

export interface Task {
  id: string;
  description: string;
  targetPath: string[];
}

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

export interface TaskSurveyResult {
  easeRating: number;
  difficultyRating: number;
  differenceRating: number;
  comments: string;
}

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
 * ★ 追加: 事後アンケート結果の型
 */
export interface PostSurveyResult {
  participantId: string; // Q1: 被験者ID
  noticeDifference: string; // Q2: 違いに気づいたか
  usabilityImpact: string[]; // Q3: やりやすさへの影響 (複数選択)
  usabilityImpactOther: string; // Q3: その他記述
  bestFeature: string; // Q4: 最も使いやすかった特徴
  improvements: string; // Q5: 改善点・コメント
}

/**
 * ★ 追加: 実験全体のデータ構造 (ダウンロード用)
 */
export interface ExperimentData {
  participantId: string;
  timestamp: string;
  tasks: TaskLog[];
  postSurvey: PostSurveyResult;
}
