import type { EasingFunction } from "../types/experiment";

/**
 * Phase 2: 難易度統制された実験タスク定義
 */

// イージング関数
export const EASING_FUNCS = [
  "linear",
  "easeInOutQuad",
  "easeInOutQuint",
  "easeInOutExpo",
  "easeInOutBack",
] as const;

// ラテン方格（5×5）
export const LATIN_SQUARE = [
  [0, 1, 2, 3, 4],
  [1, 2, 3, 4, 0],
  [2, 3, 4, 0, 1],
  [3, 4, 0, 1, 2],
  [4, 0, 1, 2, 3],
];

/** タスク難易度 */
export type TaskDifficulty = "easy" | "medium" | "hard";

/** タスク定義（メニュー構造は別途menu_categories.jsonから取得） */
export interface TaskDefinition {
  id: string;
  difficulty: TaskDifficulty;
  targetPath: string[]; // 正解パス（例: ['スポーツ', 'ゴルフ', 'ゴルフボール']）
  description: string; // タスク説明文
}

/**
 * Phase 2: 実験用タスク（15タスク = 5イージング × 3難易度）
 */
export const EXPERIMENT_TASKS: TaskDefinition[] = [
  // ========== Easy: 2階層（カテゴリ → サブカテゴリ）==========
  {
    id: "easy-1",
    difficulty: "easy",
    targetPath: ["スポーツ・アウトドア", "ゴルフ"],
    description: "「ゴルフ」カテゴリを探してクリックしてください",
  },
  {
    id: "easy-2",
    difficulty: "easy",
    targetPath: ["日常食料品", "フルーツ"],
    description: "「フルーツ」カテゴリを探してクリックしてください",
  },
  {
    id: "easy-3",
    difficulty: "easy",
    targetPath: ["ペット日用品", "ペットフード"],
    description: "「ペットフード」カテゴリを探してクリックしてください",
  },
  {
    id: "easy-4",
    difficulty: "easy",
    targetPath: ["園芸・ガーデン", "園芸用品"],
    description: "「園芸用品」カテゴリを探してクリックしてください",
  },
  {
    id: "easy-5",
    difficulty: "easy",
    targetPath: ["書籍・雑誌・漫画・絵本", "書籍"],
    description: "「書籍」カテゴリを探してクリックしてください",
  },

  // ========== Medium: 3階層（カテゴリ → サブカテゴリ → アイテム）==========
  {
    id: "medium-1",
    difficulty: "medium",
    targetPath: ["スポーツ・アウトドア", "ゴルフ", "ゴルフボール"],
    description: "「ゴルフボール」を探してクリックしてください",
  },
  {
    id: "medium-2",
    difficulty: "medium",
    targetPath: ["日常食料品", "フルーツ", "りんご"],
    description: "「りんご」を探してクリックしてください",
  },
  {
    id: "medium-3",
    difficulty: "medium",
    targetPath: ["ペット日用品", "ペットフード", "ドッグフード"],
    description: "「ドッグフード」を探してクリックしてください",
  },
  {
    id: "medium-4",
    difficulty: "medium",
    targetPath: ["園芸・ガーデン", "園芸用品", "植木鉢"],
    description: "「植木鉢」を探してクリックしてください",
  },
  {
    id: "medium-5",
    difficulty: "medium",
    targetPath: ["書籍・雑誌・漫画・絵本", "書籍", "小説"],
    description: "「小説」を探してクリックしてください",
  },

  // ========== Hard: 深い階層 or 長いカテゴリ名 ==========
  {
    id: "hard-1",
    difficulty: "hard",
    targetPath: [
      "ダイエット・健康",
      "リラックス＆セルフケア",
      "アロマセラピー",
    ],
    description: "「アロマセラピー」を探してクリックしてください",
  },
  {
    id: "hard-2",
    difficulty: "hard",
    targetPath: ["雑貨・文具・裁縫・ギフト", "文房具", "ボールペン"],
    description: "「ボールペン」を探してクリックしてください",
  },
  {
    id: "hard-3",
    difficulty: "hard",
    targetPath: ["ペット日用品", "ペットケア用品", "ペットケアシャンプー"],
    description: "「ペットケアシャンプー」を探してクリックしてください",
  },
  {
    id: "hard-4",
    difficulty: "hard",
    targetPath: ["日常食料品", "魚介類", "鮭"],
    description: "「鮭」を探してクリックしてください",
  },
  {
    id: "hard-5",
    difficulty: "hard",
    targetPath: ["スポーツ・アウトドア", "アウトドア", "テント"],
    description: "「テント」を探してクリックしてください",
  },
];

/**
 * 難易度別にタスクを取得
 */
export function getTasksByDifficulty(
  difficulty: TaskDifficulty
): TaskDefinition[] {
  return EXPERIMENT_TASKS.filter((task) => task.difficulty === difficulty);
}

/**
 * ラテン方格に基づいてタスクとイージングを取得
 * @param participantId 参加者ID（0-14）
 * @param trialIndex タスク番号（0-14）
 */
export function getTaskForTrial(
  participantId: number,
  trialIndex: number
): { task: TaskDefinition; easing: EasingFunction } {
  // ラテン方格からイージング関数を決定
  const easingBlockIndex = Math.floor(trialIndex / 3); // 0-4（各イージングで3タスク）
  const easingIndex = LATIN_SQUARE[participantId % 5][easingBlockIndex];
  const easing = EASING_FUNCS[easingIndex] as EasingFunction;

  // 難易度を決定（easy → medium → hard を繰り返す）
  const difficulty: TaskDifficulty =
    trialIndex % 3 === 0 ? "easy" : trialIndex % 3 === 1 ? "medium" : "hard";

  // 難易度内でタスクをローテーション
  const tasks = getTasksByDifficulty(difficulty);
  const taskIndex = easingBlockIndex % tasks.length;
  const task = tasks[taskIndex];

  return { task, easing };
}

/**
 * 全15タスクの順序を生成
 * @param participantId 参加者ID
 */
export function generateTaskSequence(participantId: number): Array<{
  trial: number;
  task: TaskDefinition;
  easing: EasingFunction;
}> {
  return Array.from({ length: 15 }, (_, i) => {
    const { task, easing } = getTaskForTrial(participantId, i);
    return {
      trial: i + 1,
      task,
      easing,
    };
  });
}

/**
 * Phase 1との互換性のための変換関数
 */
export function convertToOldTaskFormat(task: TaskDefinition) {
  return {
    category: task.targetPath[0],
    subcat: task.targetPath[1] || "",
    item: task.targetPath[2] || "",
  };
}

// Phase 1用（後方互換性）
export const FIXED_TASKS_JA = EXPERIMENT_TASKS.slice(5, 10).map(
  convertToOldTaskFormat
);

// 🆕 英語版タスク（Phase 1互換）
export const FIXED_TASKS_EN = [
  { category: "Sports & Outdoors", subcat: "Golf", item: "Golf Balls" },
  { category: "Groceries", subcat: "Fruits", item: "Apple" },
  { category: "Pet Supplies", subcat: "Pet Food", item: "Dog Food" },
  {
    category: "Gardening & DIY",
    subcat: "Gardening Supplies",
    item: "Planters",
  },
  { category: "Books", subcat: "Books", item: "Novels" },
];

export const MAX_TASKS = 15; // Phase 2は15タスク
export const TIME_LIMIT_MS = 20000; // 20秒に延長（3階層対応）
