// --- START OF FILE src/utils/task.ts ---

import type { Category, Task, EasingFunction } from "../experiment";

// タスクの制限時間（ミリ秒）
// 現状は100秒と長めに設定されています
export const TIME_LIMIT_MS = 1000000;

// 実験で使用するイージング関数のリスト
// 以下の5種類を比較対象とします
export const EASING_FUNCS: EasingFunction[] = [
  "linear",          // 等速
  "easeInOutQuad",   // 緩やかな加減速
  "easeInOutQuint",  // 急激な加減速
  "easeInOutExpo",   // 非常に急激な加減速
  "easeInOutBack",   // 行き過ぎて戻る動き
];

type Lang = "ja" | "en";

/**
 * キャッシュバスティング付きのフェッチ関数
 * ブラウザのキャッシュを回避して常に最新のJSONを取得するために使用します
 * @param url 取得するファイルのURL
 */
const fetchWithCacheBuster = async (url: string) => {
  // タイムスタンプをクエリパラメータに付与
  const bustedUrl = `${url}?t=${new Date().getTime()}`;
  const response = await fetch(bustedUrl);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
};

/**
 * メニューカテゴリデータをJSONファイルから読み込む関数
 * @param lang 言語設定 ('ja' | 'en')
 * @returns カテゴリ配列のPromise
 */
export const loadMenuCategories = async (
  lang: Lang = "ja"
): Promise<Category[]> => {
  try {
    // 言語に応じて読み込むファイルを切り替え
    const filename =
      lang === "en" ? "/menu_categories_en.json" : "/menu_categories.json";
    const data = await fetchWithCacheBuster(filename);
    return data.categories;
  } catch (error) {
    console.error("Categories load error:", error);
    return [];
  }
};

/**
 * チュートリアル用のカテゴリデータを読み込む関数
 * 現状はメインのメニューデータと同じものを使用していますが、
 * 将来的に分離可能なように関数を分けています
 * @param lang 言語設定
 */
export const loadTutorialCategories = async (
  lang: Lang = "ja"
): Promise<Category[]> => {
  try {
    const filename =
      lang === "en" ? "/menu_categories_en.json" : "/menu_categories.json";
    const data = await fetchWithCacheBuster(filename);
    return data.categories;
  } catch (error) {
    console.error("Tutorial load error:", error);
    return [];
  }
};

/**
 * カテゴリツリーを探索して、末端（サブカテゴリを持たない）の項目をすべて抽出し、
 * タスク（目標アイテム）のリストを生成する関数
 * @param categories カテゴリツリーのルート配列
 * @returns タスクオブジェクトの配列
 */
export const generateTasksFromCategories = (categories: Category[]): Task[] => {
  const tasks: Task[] = [];

  // 再帰的にカテゴリを探索
  const traverse = (cats: Category[], path: string[]) => {
    cats.forEach((cat, index) => {
      const currentPath = [...path, cat.name];
      // サブカテゴリがない場合、それをタスクのターゲットとする
      if (!cat.subcategories || cat.subcategories.length === 0) {
        tasks.push({
          id: currentPath.join("-"),
          // 説明文はApp.tsx側で動的に生成されるため、ここはプレースホルダー的な役割
          description: `「${cat.name}」を探してクリックしてください`,
          targetPath: currentPath,
          leafIndex: index, // 親カテゴリ内でのインデックス（0-4）
        });
      } else {
        // サブカテゴリがある場合、さらに深く探索
        traverse(cat.subcategories, currentPath);
      }
    });
  };

  traverse(categories, []);
  return tasks;
};

/**
 * 実験用のタスクシーケンスを生成する関数
 * ラテン方格法を用いて、参加者ごとにイージング関数の提示順序を制御します
 * 
 * @param participantId 参加者ID（数値）
 * @param availableTasks 利用可能な全タスクのリスト
 * @returns 試行順序、タスク、イージング関数のセット配列
 */
export const generateTaskSequence = (
  participantId: number,
  availableTasks: Task[]
): { trial: number; task: Task; easing: EasingFunction }[] => {
  const sequence: { trial: number; task: Task; easing: EasingFunction }[] = [];
  const TRIALS_PER_EASING = 2; // 1つのイージングにつき4回試行
  const POSITIONS = [1, 2, 3, 4]; // 使用するポジション（0=一番上を除外）

  // シード付き乱数生成器 (Linear Congruential Generator)
  let localSeed = participantId;
  const random = () => {
    localSeed = (localSeed * 9301 + 49297) % 233280;
    return localSeed / 233280;
  };

  // タスクをポジション（leafIndex）ごとにグループ化
  const tasksByPosition: Record<number, Task[]> = {};
  POSITIONS.forEach(pos => {
    tasksByPosition[pos] = availableTasks.filter(t => t.leafIndex === pos);
    // Fisher-Yates シャッフルで公平にランダム化
    const arr = tasksByPosition[pos];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  });

  // (Easing, Position) のペアを作成
  // 各イージングについて、TRIALS_PER_EASING回数分、ポジションを割り当てる
  let pairs: { easing: EasingFunction; position: number }[] = [];
  EASING_FUNCS.forEach(easing => {
    for (let i = 0; i < TRIALS_PER_EASING; i++) {
      // ポジションを順番に割り当て（足りなくなったらループ）
      const pos = POSITIONS[i % POSITIONS.length];
      pairs.push({ easing, position: pos });
    }
  });

  // ペアの順序をランダムにシャッフル
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  // ペアに基づいてタスクを割り当て
  pairs.forEach((pair, index) => {
    // 指定されたポジションのタスクプールから1つ取り出す
    let task = tasksByPosition[pair.position].pop();

    // 万が一足りない場合は、再度フィルタしてランダムに取得
    if (!task) {
      const candidates = availableTasks.filter(t => t.leafIndex === pair.position);
      task = candidates[Math.floor(random() * candidates.length)];
    }

    sequence.push({
      trial: index + 1,
      task: task!,
      easing: pair.easing,
    });
  });

  return sequence;
};
