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
 * 事前アンケート結果の型
 */
export interface PreSurveyData {
  preferences: Record<EasingFunction, number>; // 1-5の評価
  ranking: EasingFunction[]; // 好みの順位
  preferenceType: 'smooth' | 'snappy' | 'other'; // 自動分類
  comments: string;
}

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
  mouseDistance?: number; // 🆕 マウスの総移動距離（ピクセル）
  survey?: TaskSurveyResult;
  seqScore?: number;
  usedEasing?: EasingFunction;
  fps?: {
    current: number;
    average: number;
    min: number;
    max: number;
    samples: number;
  };
}

/**
 * 事後アンケート結果の型
 */
export interface PostSurveyResult {
  participantId: string;
  noticeDifference: string;
  usabilityImpact: string[];
  usabilityImpactOther: string;
  bestFeature: string;
  worstFeature: string;
  improvements: string;
}

/**
 * 実験全体のデータ構造
 */
export interface ExperimentData {
  participantId: string;
  timestamp: string;
  preSurvey: PreSurveyData; // 🆕 事前アンケートデータ
  tasks: TaskLog[];
  postSurvey: PostSurveyResult;
  systemInfo?: {
    clientIP: string;
    publicIP: string;
    userAgent: string;
    screenInfo: {
      width: number;
      height: number;
      availWidth: number;
      availHeight: number;
      colorDepth: number;
      pixelRatio: number;
    };
  };
}
