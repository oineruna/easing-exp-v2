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
}

/**
 * クリックイベントの詳細ログ
 * ユーザーの操作を詳細に記録するためのデータ構造です
 */
export interface ClickRecord {
  step: number;             // タスク内でのクリック順序（1始まり）
  action: string;           // クリックしたカテゴリ名
  depth: number;            // クリックした階層の深さ（0始まり）
  duringAnimation: boolean; // アニメーション中にクリックしたか
  stayTime: number;         // 前回のクリックからの経過時間（秒）
  timestamp: string;        // クリック時の絶対時刻
  isCorrect?: boolean;      // 正解アイテムだったか（タスク完了時のみ）
  x?: number;               // クリック位置のX座標
  y?: number;               // クリック位置のY座標
}

// ClickLogはClickRecordのエイリアスとして定義
export type ClickLog = ClickRecord;

/**
 * 事前アンケート結果のデータ構造
 * 実験開始前に取得する参加者の属性や好み
 */
export interface PreSurveyData {
  preferences: Record<EasingFunction, number>; // 各イージングへの評価（1-5）
  ranking: EasingFunction[];                   // 好みの順位付け
  preferenceType: 'smooth' | 'snappy' | 'other'; // 自動分類された好みのタイプ
  comments: string;                            // 自由記述コメント
}

/**
 * タスク終了後のアンケート結果
 * 各タスク直後に表示されるポップアップでの回答
 */
export interface TaskSurveyResult {
  easeRating: number;       // 操作のしやすさ（1-5）
  difficultyRating: number; // タスクの難易度（1-5）
  differenceRating: number; // 違和感の有無（1-5）
  comments: string;         // 自由記述コメント
}

/**
 * 1タスクごとの実験記録（ログ）
 * パフォーマンスデータと主観評価を統合したものです
 */
export interface TaskLog {
  trialNumber: number;            // 試行番号（通し番号）
  taskId: string;                 // タスクID
  targetItem: string;             // 目標アイテム名
  easingFunction: EasingFunction; // 適用されたイージング関数

  // パフォーマンス指標
  isCorrect: boolean;             // 正解したか
  timedOut: boolean;              // 制限時間切れか
  totalDuration: number;          // 所要時間（ミリ秒）
  firstClickTime?: number;        // 初回クリックまでの時間（秒）
  clickCount: number;             // 総クリック数
  errorCount: number;             // エラー（誤クリック）数

  // 詳細トラッキング
  clicks: ClickRecord[];          // 全クリックの履歴
  menuTravelDistance?: number;    // メニュー階層の移動距離
  mouseDistance?: number;         // マウスカーソルの総移動距離（ピクセル）

  // アニメーション関連のインタラクション
  interactedDuringAnimation?: boolean; // アニメーション中に操作が発生したか
  animationClickCount?: number;        // アニメーション中のクリック総数
  animationErrorCount?: number;        // アニメーション中の誤クリック数

  // 主観評価
  survey?: TaskSurveyResult;      // タスク後アンケート結果

  // その他
  seqScore?: number;              // （内部用）シーケンススコア
  usedEasing?: EasingFunction;    // 実際に使用されたイージング（確認用）

  // システムパフォーマンス
  fps?: {
    average: number; // 平均フレームレート
    min: number;     // 最小フレームレート
    max: number;     // 最大フレームレート
  };
}

/**
 * 事後アンケート結果のデータ構造
 * 全タスク終了後に取得する総合的な評価
 */
export interface PostSurveyResult {
  noticeDifference: string;     // イージングの違いに気づいたか
  usabilityImpact: string[];    // 操作性に影響した要素（複数回答）
  usabilityImpactOther: string; // その他（自由記述）
  bestFeature: string;          // 最も良かった点
  worstFeature: string;         // 最も悪かった点
  improvements: string;         // 改善点・要望
}

/**
 * 実験全体のデータ構造（ルートオブジェクト）
 * 最終的にJSONとして保存されるデータの形式です
 */
export interface ExperimentData {
  participantId: string;        // 参加者ID
  timestamp: string;            // 実験実施日時

  preSurvey: PreSurveyData;     // 事前アンケートデータ
  tasks: TaskLog[];             // 全タスクのログ配列
  postSurvey: PostSurveyResult; // 事後アンケートデータ

  // 参加者の環境情報
  systemInfo?: {
    // clientIP: string;        // IPアドレス（現在は無効化）
    // publicIP: string;
    userAgent: string;          // ブラウザ・OS情報
    screenInfo: {
      width: number;            // 画面幅
      height: number;           // 画面高さ
      availWidth: number;       // 有効画面幅
      availHeight: number;      // 有効画面高さ
      colorDepth: number;       // 色深度
      pixelRatio: number;       // ピクセル比
    };
  };
}
