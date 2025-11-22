// --- START OF FILE src/utils/task.ts ---

import type { Category, Task, EasingFunction } from "../experiment";

export const TIME_LIMIT_MS = 100;

export const EASING_FUNCS: EasingFunction[] = [
  "linear",
  "easeInOutQuad",
  "easeInOutQuint",
  "easeInOutExpo",
  "easeInOutBack",
];

type Lang = "ja" | "en";

/**
 * キャッシュバスティング付きのフェッチ
 */
const fetchWithCacheBuster = async (url: string) => {
  const bustedUrl = `${url}?t=${new Date().getTime()}`;
  const response = await fetch(bustedUrl);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
};

/**
 * メニューカテゴリを読み込む
 */
export const loadMenuCategories = async (
  lang: Lang = "ja"
): Promise<Category[]> => {
  try {
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
 * チュートリアル用カテゴリを読み込む
 */
export const loadTutorialCategories = async (
  lang: Lang = "ja"
): Promise<Category[]> => {
  try {
    // チュートリアル用も同じファイル構造を参照するか、専用ファイルがあればそちらを指定
    // ここでは簡易的にメインと同じファイルを使用
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
 * カテゴリからタスクリストを生成
 */
export const generateTasksFromCategories = (categories: Category[]): Task[] => {
  const tasks: Task[] = [];

  const traverse = (cats: Category[], path: string[]) => {
    cats.forEach((cat) => {
      const currentPath = [...path, cat.name];
      if (!cat.subcategories || cat.subcategories.length === 0) {
        tasks.push({
          id: currentPath.join("-"),
          // 簡易的な説明文生成。多言語対応を厳密にするなら別途ID管理が必要ですが
          // ここでは生成時に言語を意識しない構造にしています
          description: `「${cat.name}」を探してクリックしてください`,
          targetPath: currentPath,
        });
      } else {
        traverse(cat.subcategories, currentPath);
      }
    });
  };

  traverse(categories, []);
  return tasks;
};

/**
 * タスクシーケンスの生成
 */
export const generateTaskSequence = (
  _participantId: number,
  availableTasks: Task[]
): { trial: number; task: Task; easing: EasingFunction }[] => {
  const sequence: { trial: number; task: Task; easing: EasingFunction }[] = [];

  // ランダムに25問抽出
  const shuffledTasks = [...availableTasks]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  shuffledTasks.forEach((task, index) => {
    const easing = EASING_FUNCS[index % EASING_FUNCS.length];
    sequence.push({
      trial: index + 1,
      task,
      easing,
    });
  });

  return sequence;
};
