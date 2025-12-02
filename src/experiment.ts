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

export interface ClickRecord {
  target: string;         // クリックしたアイテム名
  timestamp: number;      // クリック時刻 (performance.now())
  isCorrect: boolean;     // 正解かどうか
  depth: number;          // 階層の深さ (0-indexed)
  duringAnimation: boolean; // アニメーション中にクリックされたか
  animationProgress?: number; // アニメーション進捗率 (0.0 - 1.0)
  distanceFromLastClick?: number; // 直前のクリック位置からの距離
  timeFromLastClick?: number;     // 直前のクリックからの経過時間
}

export interface MouseTrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  duringAnimation: boolean;
}

/**
 * 1タスクごとの実験記録（ログ）
 * パフォーマンスデータと主観評価を統合したものです
 */
export interface TaskLog {
  trialNumber: number;    // 試行番号
  taskId: string;         // タスクID
  targetItem: string;     // 目標アイテム名
  easingFunction: EasingFunction; // 使用したイージング関数

  isCorrect: boolean;     // 正解したか（タイムアウト含む）
  timedOut: boolean;      // タイムアウトしたか
  totalDuration: number;  // 総所要時間 (ms)
  firstClickTime: number; // 最初のクリックまでの時間 (ms)
  clickCount: number;     // 総クリック数
  errorCount: number;     // エラー数
  
  clicks: ClickRecord[];  // クリック詳細ログ
  
  menuTravelDistance: number; // メニュー階層移動距離
  mouseDistance: number;      // マウス総移動距離 (px)
  
  interactedDuringAnimation: boolean; // アニメーション中の操作があったか
  animationClickCount?: number;        // アニメーション中のクリック総数
  animationErrorCount?: number;        // アニメーション中の誤クリック数

  // 新しい指標
  clickEfficiency?: number; // クリック効率 (最短パス長 / 総クリック数)
  frustrationCount?: number; // フラストレーション回数 (連打など)

  // マウス軌跡・詳細指標
  // mouseTrajectory?: MouseTrajectoryPoint[]; // 削除: データ量削減のため
  jitteriness?: number; // ふらつき指標 (角度変化の総和)
  overshootCount?: number; // オーバーシュート回数

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
  timestamp: string;            // 実験実施日時（提出日時）
  startTime?: string;           // 実験開始日時
  endTime?: string;             // 実験終了日時

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
