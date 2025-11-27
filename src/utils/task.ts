// --- START OF FILE src/utils/task.ts ---

import type { Category, Task, EasingFunction } from "../experiment";

// タスクの制限時間（ミリ秒）
// 現状は100秒と長めに設定されています
export const TIME_LIMIT_MS = 100000;

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
    cats.forEach((cat) => {
      const currentPath = [...path, cat.name];
      // サブカテゴリがない場合、それをタスクのターゲットとする
      if (!cat.subcategories || cat.subcategories.length === 0) {
        tasks.push({
          id: currentPath.join("-"),
          // 説明文はApp.tsx側で動的に生成されるため、ここはプレースホルダー的な役割
          description: `「${cat.name}」を探してクリックしてください`,
          targetPath: currentPath,
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
  const TRIALS_PER_EASING = 5; // 1つのイージングにつき5回試行
  const TOTAL_TRIALS = EASING_FUNCS.length * TRIALS_PER_EASING; // 合計25回

  // 1. 利用可能なタスクからランダムに25個選出（重複なし）
  // Fisher-Yates的なランダムソートでシャッフル
  const shuffledAvailableTasks = [...availableTasks].sort(
    () => Math.random() - 0.5
  );
  // 必要な数だけ切り出し
  const selectedTasks = shuffledAvailableTasks.slice(0, TOTAL_TRIALS);

  // 2. ラテン方格に基づくイージング順序の決定
  // 参加者IDに基づいて開始位置（オフセット）を決定 (0-4)
  const startOffset = participantId % EASING_FUNCS.length;

  // 基本となるイージング順序を作成 (例: ID=1 -> [1, 2, 3, 4, 0])
  // これにより、参加者によって [A,B,C,D,E] だったり [B,C,D,E,A] だったりする
  const baseEasingSequence: EasingFunction[] = [];
  for (let i = 0; i < EASING_FUNCS.length; i++) {
    const index = (startOffset + i) % EASING_FUNCS.length;
    baseEasingSequence.push(EASING_FUNCS[index]);
  }

  // 3. タスクとイージングを結合
  // イージング順序は固定（ラテン方格）、タスクはランダムに割り当て
  selectedTasks.forEach((task, index) => {
    // 5回ごとにイージングを切り替える (ブロックデザイン)
    // index 0-4: Easing A
    // index 5-9: Easing B ...
    const easingIndex = Math.floor(index / TRIALS_PER_EASING) % baseEasingSequence.length;
    const easing = baseEasingSequence[easingIndex];

    sequence.push({
      trial: index + 1,
      task,
      easing,
    });
  });

  return sequence;
};
