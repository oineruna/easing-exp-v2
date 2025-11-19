import type { Task, Category, EasingFunction } from "../types/experiment";

// タスクの制限時間（ミリ秒）
export const TIME_LIMIT_MS = 20000; // 例: 20秒

// 使用するイージング関数を定義
export const EASING_FUNCS = [
  "linear",
  "easeInOutQuad",
  "easeInOutQuint",
  "easeInOutExpo",
  "easeInOutBack",
] as const;

// 5x5 ラテン方格の定義 (イージングの順序を決定)
export const LATIN_SQUARE = [
  [0, 1, 2, 3, 4],
  [1, 2, 3, 4, 0],
  [2, 3, 4, 0, 1],
  [3, 4, 0, 1, 2],
  [4, 0, 1, 2, 3],
];

let globalCategories: Category[] = [];

/**
 * メニュー構造をJSONファイルからロードする。
 * @returns カテゴリーの配列
 */
export async function loadMenuCategories(): Promise<Category[]> {
  if (globalCategories.length > 0) return globalCategories;
  try {
    // 既存のfetch("/menu_categories.json")を使用
    const response = await fetch("/menu_categories.json");
    const data = await response.json();
    globalCategories = data.categories as Category[];
    return globalCategories;
  } catch (error) {
    console.error("Failed to load menu_categories.json:", error);
    return [];
  }
}

/**
 * メニュー構造から3層目の末端ノードを5つ選び、そのパスを返す。
 * @param _categories - メニュー構造のカテゴリー配列 (警告回避のため未使用変数に_)
 * @returns ターゲットパスの配列 (例: [["A", "B", "C"], ...])
 */
function pickFiveLevel3Tasks(_categories: Category[]): string[][] {
  // 👈 categories を _categories にリネーム
  const candidates: string[][] = [];

  // 深さ優先探索で3層目のパスを収集
  function _dfs(cat: Category, path: string[] = []) {
    // 👈 dfs を _dfs にリネーム
    // 現在のパスを更新
    const currentPath = [...path, cat.name];
    const depth = currentPath.length;

    // 3層目（depth=3）の項目をターゲットとして収集
    // かつ、サブカテゴリがないもの（末端ノード）をタスクとする
    if (depth === 3 && (!cat.subcategories || cat.subcategories.length === 0)) {
      candidates.push(currentPath);
      return; // 3層目で見つかったら、それ以上深掘りしない
    }

    // 4層目以上になったら終了 (メニュー構造が3層までと仮定)
    if (depth >= 3) return;

    // サブカテゴリがあれば深掘り
    if (cat.subcategories) {
      cat.subcategories.forEach((sc) => _dfs(sc, currentPath));
    }
  }

  // ルートカテゴリーから探索を開始
  _categories.forEach((cat) => _dfs(cat));

  // 収集した候補から先頭の5つを選択
  if (candidates.length < 5) {
    console.warn(
      `Warning: Could only find ${candidates.length} tasks at level 3. Returning all found tasks.`
    );
  }

  // 少なくとも5つのタスクが必要なので、先頭5つを返す
  return candidates.slice(0, 5);
}

/**
 * 試行で使用するタスクの定義
 */
export interface TaskDefinition {
  id: string;
  targetPath: string[];
  description: string;
}

/**
 * メニュー構造から TaskDefinition のリストを生成する。
 * @param categories - メニュー構造
 * @returns タスク定義の配列
 */
export function generateTasksFromCategories(
  categories: Category[]
): TaskDefinition[] {
  // 3層目のターゲットパスを5つ選ぶ
  const paths = pickFiveLevel3Tasks(categories);

  if (paths.length === 0) {
    console.error("FATAL: No level 3 tasks found in menu structure.");
    return [];
  }

  // TaskDefinitionのリストを生成
  return paths.map((path, i) => ({
    id: `task-${i + 1}`,
    targetPath: path,
    description: `「**${path[path.length - 1]}**」を探してクリックしてください`, // ターゲットを太字に
  }));
}

/**
 * TaskDefinitionを実験で使用するTask型に変換する。
 */
function taskDefToTask(def: TaskDefinition): Task {
  return {
    id: def.id,
    // ⚠️ 以前の Task 型には difficulty が含まれていたが、現在は TaskDefinition にないので、
    // ここでも含めない。Task型定義を更新する必要がある。
    targetPath: def.targetPath,
    description: def.description,
    categories: globalCategories, // ロード済みのメニュー構造をセット
  };
}

/**
 * ラテン方格に基づき、特定の試行に対するタスクとイージングを割り当てる。
 * @param participantId - 参加者ID
 * @param trialIndex - 試行インデックス (0始まり)
 * @param tasks - タスク定義の配列 (5つ想定)
 * @returns 割り当てられたタスクとイージング
 */
export function getTaskForTrial(
  participantId: number,
  trialIndex: number,
  tasks: TaskDefinition[]
): { task: Task; easing: EasingFunction } {
  // 5タスクを循環させる (タスクローテーション)
  const taskIndex = trialIndex % tasks.length;
  // 5イージングのブロック（5試行）を循環させる (イージングローテーション)
  const easingBlockIndex = Math.floor(trialIndex / tasks.length);

  // 参加者IDに基づきラテン方格からイージングのインデックスを取得
  // participantId % 5 で行を、easingBlockIndex で列を決定
  const participantMod = participantId % 5;
  const easingIndex = LATIN_SQUARE[participantMod][easingBlockIndex];

  const easing = EASING_FUNCS[easingIndex] as EasingFunction;
  const taskDef = tasks[taskIndex];
  const task = taskDefToTask(taskDef);

  return { task, easing };
}

/**
 * 全25試行（5タスク x 5イージング）のシーケンスを生成する。
 * @param participantId - 参加者ID
 * @param tasks - タスク定義の配列 (5つ想定)
 * @returns 全試行のシーケンス
 */
export function generateTaskSequence(
  participantId: number,
  tasks: TaskDefinition[]
): Array<{ trial: number; task: Task; easing: EasingFunction }> {
  // 5タスク * 5イージング = 25試行
  const trialCount = tasks.length * EASING_FUNCS.length;

  return Array.from({ length: trialCount }, (_, i) => {
    const { task, easing } = getTaskForTrial(participantId, i, tasks);
    return { trial: i + 1, task, easing };
  });
}
