// 既存の型定義
export type EasingFunction =
  | "linear"
  | "easeInOutQuad"
  | "easeInOutQuint"
  | "easeInOutExpo"
  | "easeInOutBack";

export interface Category {
  name: string;
  subcategories?: Category[];
}

export type Lang = "ja" | "en";

// 🆕 実験用の型定義

/** タスク難易度 */
export type TaskDifficulty = "easy" | "medium" | "hard";

/** 被験者の好みタイプ */
export type PreferenceType = "smooth" | "snappy" | "neutral";

/** タスク定義 */
export interface Task {
  id: string;
  difficulty: TaskDifficulty;
  targetPath: string[]; // 正解パス
  description: string; // タスク説明文
  categories: Category[]; // メニュー構造
}

/** クリック記録 */
export interface ClickRecord {
  timestamp: number;
  itemName: string;
  depth: number;
  isCorrect: boolean;
  isBacktrack: boolean;
  duringAnimation: boolean; // 🆕 アニメーション中のクリックか
  stayTime: number; // 🆕 前回クリックからの滞在時間（秒）
}

/** タスクログ（1タスクの記録） */
export interface TaskLog {
  taskId: string;
  participantId: string;
  easingFunction: EasingFunction;
  difficulty: TaskDifficulty;
  preferenceType: PreferenceType;

  // タイミング
  startTime: number;
  firstClickTime: number | null;
  completionTime: number | null;
  totalDuration: number | null;

  // 操作
  clickSequence: ClickRecord[];
  totalClicks: number;
  errorClicks: number;
  backtrackCount: number;

  // 主観評価
  singleEaseScore: number | null; // SEQ (1-7)

  // 成功判定
  isCompleted: boolean;
}

/** イージング関数別の事後評価 */
export interface EasingEvaluation {
  easingFunction: EasingFunction;
  usability: number; // 使いやすさ (1-7)
  smoothness: number; // 滑らかさ (1-7)
  responsiveness: number; // 応答性 (1-7)
  preference: number; // 総合的好み (1-7)
}

/** NASA-TLX評価 */
export interface NASATLXScore {
  mentalDemand: number; // 精神的要求 (0-100)
  physicalDemand: number; // 身体的要求 (0-100)
  temporalDemand: number; // 時間的要求 (0-100)
  performance: number; // 作業成績 (0-100)
  effort: number; // 努力 (0-100)
  frustration: number; // フラストレーション (0-100)
}

/** 実験セッション全体のデータ */
export interface ExperimentSession {
  participantId: string;
  preferenceType: PreferenceType;
  startTime: number;
  endTime: number | null;

  // 事前アンケート
  preSurvey: {
    preferences: Record<EasingFunction, number>;
    ranking: EasingFunction[];
    comments: string;
  };

  // タスクログ
  taskLogs: TaskLog[];

  // 事後評価
  easingEvaluations: EasingEvaluation[];
  nasaTLX: NASATLXScore | null;
  postComments: string;
}

/** 実験条件の割り当て */
export interface ExperimentCondition {
  participantId: string;
  preferenceType: PreferenceType;
  easingOrder: EasingFunction[]; // ラテン方格
  taskOrder: Task[]; // 各イージングでのタスク順
}

/** ベジェ曲線の定義 */
export type BezierCurve = [number, number, number, number];

/** イージング関数のメタデータ */
export interface EasingMetadata {
  name: EasingFunction;
  label: { ja: string; en: string };
  description: { ja: string; en: string };
  bezier: BezierCurve;
  category: "smooth" | "snappy" | "special";
}
