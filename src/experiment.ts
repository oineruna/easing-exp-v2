// --- START OF FILE src/experiment.ts ---

/**
 * 言語設定の型定義
 * アプリケーション全体の国際化（i18n）で使用されます
 */
export type Lang = "ja" | "en";

/**
 * メニューのカテゴリ構造定義
 * 再帰的な構造を持ち、多階層のメニューを表現します
 */
export type Category = {
  name: string;                // カテゴリ名（表示用）
  subcategories?: Category[];  // 子カテゴリのリスト（存在する場合）
};

/**
 * 実験で使用するイージング関数の種類
 * CSS transition-timing-function に対応する文字列です
 */
export type EasingFunction =
  | "linear"          // 等速
  | "easeInOutQuad"   // 2次関数（緩やか）
  | "easeInOutQuint"  // 5次関数（急激）
  | "easeInOutExpo"   // 指数関数（非常に急激）
  | "easeInOutBack";  // 戻る動き

/**
 * 実験タスクの定義
 * 参加者が探すべき目標アイテムの情報を含みます
 */
export interface Task {
  id: string;             // タスクの一意なID（パス結合文字列など）
  description: string;    // 画面に表示する指示文
  targetPath: string[];   // 目標アイテムまでの階層パス（正解判定用）
  leafIndex?: number;     // 末端カテゴリ内でのインデックス（0-4）
}

/**
 * ナビゲーションパスの各ステップ（過去のデータ形式）
 * 旧: ClickRecord -> 新: NavigationStep
 */
export interface NavigationStep {
  step: number;           // ステップ数 (1-indexed)
  action: string;         // クリックしたアイテム名（旧: target）
  depth: number;          // 階層の深さ (0-indexed)
  duringAnimation: boolean; // アニメーション中にクリックされたか
  animationProgress?: number; // アニメーション進捗率 (0.0 - 1.0)
  stayTime: number;       // 滞在時間（秒単位）
  depthTrace?: number[];  // 深さの履歴 (トレース) - 配列全体で保持する場合はTaskResult側だが、ステップごとに記録するならここ? 
  // いや、useTaskLoggerではTaskResult側に depthTrace を追加した。NavigationStepには不要。
}

// 後方互換性のため
export type ClickRecord = NavigationStep;
export type ClickLog = NavigationStep;

export interface MouseTrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  duringAnimation: boolean;
}

/**
 * 事前アンケート結果のデータ構造
 */
export interface PreSurveyData {
  preferences: Record<EasingFunction, number>;
  ranking: EasingFunction[];
  preferenceType: 'smooth' | 'snappy' | 'other';
  comments: string;
}

/**
 * タスク終了後のアンケート結果（内部使用）
 */
export interface TaskSurveyResult {
  easeRating: number;       // 操作のしやすさ（1-5）
  difficultyRating: number; // タスクの難易度（1-5）
  differenceRating: number; // 違和感の有無（1-5）
  comments: string;         // 自由記述コメント
}

/**
 * ユーザーフィードバック（出力用 - 過去のデータ形式）
 */
export interface UserFeedback {
  animationEaseRating: string;    // 操作のしやすさ（1-5）文字列形式
  taskDifficultyRating: string;   // タスクの難易度（1-5）文字列形式
  animationDifferenceRating: string; // 違和感の有無（1-5）文字列形式
  comments: string;               // 自由記述コメント
}

/**
 * タスク概要（過去のデータ形式）
 */
export interface TaskOverview {
  taskIndex: number;          // タスク番号（1-indexed）
  targetItem: string;         // 目標アイテム名
  optimalPath: string[];      // 最適解のパス配列
  easingFunction: EasingFunction; // 使用したイージング関数
  totalTimeSec: number;       // 総所要時間（秒）
  firstClickDelaySec: number; // 最初のクリックまでの時間（秒）
  success: boolean;           // 成功したか（旧: isCorrect）
}

/**
 * パフォーマンス指標（過去のデータ形式）
 */
export interface Performance {
  actualPath: string[];       // 実際にクリックした項目のリスト
  errorCount: number;         // エラー数
  menuTravelDistance: number; // メニュー階層移動距離
  pathEfficiency: number;     // パス効率（旧: clickEfficiency）
  timedOut: boolean;          // タイムアウトしたか

  // アニメーション関連指標
  animationClickCount: number;        // アニメーション中のクリック総数
  animationErrorCount: number;        // アニメーション中の誤クリック数

  // 追加の詳細指標
  mouseDistance?: number;      // マウス総移動距離 (px)
  jitteriness?: number;        // ふらつき指標
  overshootCount?: number;     // オーバーシュート回数
  frustrationCount?: number;   // フラストレーション回数
}

/**
 * タスク結果（過去のデータ形式に合わせた新構造）
 */
export interface TaskResult {
  taskOverview: TaskOverview;
  navigationPath: NavigationStep[];
  performance: Performance;
  depthTrace?: number[]; // 追加：タスク全体の深さ遷移
  userFeedback: UserFeedback;
}

/**
 * 事後アンケート結果
 */
export interface PostSurveyResult {
  noticeDifference: string;
  usabilityImpact: string[];
  usabilityImpactOther: string;
  bestFeature: string;
  bestFeatureOther?: string;
  worstFeature: string;
  worstFeatureOther?: string;
  improvements: string;
}

/**
 * メタデータ（過去のデータ形式）
 */
export interface Metadata {
  participantId: string;
  experimentDate: string;    // ISO 8601形式
  averageFps?: number;
}

/**
 * 実験全体のデータ構造（過去のデータ形式に合わせた新構造）
 */
export interface ExperimentData {
  metadata: Metadata;
  taskResults: TaskResult[];
  preSurvey?: PreSurveyData;
  postSurvey?: PostSurveyResult;

  // システム情報
  systemInfo?: {
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

// 後方互換性のため、古い TaskLog インターフェースも残す（内部処理用）
export interface TaskLog {
  trialNumber: number;
  targetItem: string;
  targetPath: string;
  optimalPath: string[];
  actualPath: string[];
  easingFunction: EasingFunction;

  isCorrect: boolean;
  timedOut: boolean;
  totalDuration: number;  // ms
  firstClickTime: number; // ms
  clickCount: number;
  errorCount: number;

  clicks: NavigationStep[];

  menuTravelDistance: number;
  mouseDistance: number;

  animationClickCount?: number;
  animationErrorCount?: number;

  optimalPathLength?: number;
  clickEfficiency?: number;
  frustrationCount?: number;

  jitteriness?: number;
  overshootCount?: number;
  depthTrace?: number[];


  survey?: TaskSurveyResult;

  seqScore?: number;
}
