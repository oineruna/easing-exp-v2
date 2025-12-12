// --- START OF FILE src/utils/task.ts ---

import type { Category, Task, EasingFunction } from "../experiment";

// タスクの制限時間（ミリ秒）
export const TIME_LIMIT_MS = 15000;

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
 * タスクから除外するカテゴリ名のブラックリスト
 * ここに追加した名前を含むパスはタスクとして生成されません
 */
const CATEGORY_BLACKLIST: string[] = [
  "トレーニング／水泳",
  // 必要に応じて追加してください
  // 例: "野球／ゴルフ",
];

/**
 * タスクとして出題する項目のホワイトリスト
 * ここに指定した項目名のみがタスクとして生成されます
 * 空配列の場合は全項目が対象（ブラックリストのみ適用）
 * 
 * 選定基準:
 * - 5つのメインカテゴリから各2項目ずつ（計10項目）
 * - 2層目の上下両方のサブカテゴリからバランスよく選択
 * - leafIndex（位置）を1〜4に均等に分散
 *   leafIndex 1: 2項目
 *   leafIndex 2: 3項目
 *   leafIndex 3: 3項目
 *   leafIndex 4: 2項目
 */
const TASK_WHITELIST: string[] = [
  // ファッション (上=トップス, 下=バッグ)
  "パーカー",           // トップス／ボトムス > トップス [leafIndex: 1]
  "ポーチバッグ",       // シューズ／バッグ > バッグ [leafIndex: 4]

  // パソコン周辺機器 (上=スピーカー, 下=記録メディア)
  "Bluetoothスピーカー", // スピーカー／イヤホン > スピーカー [leafIndex: 2]
  "マイクロSDカード",    // キーボード／記録メディア > 記録メディア [leafIndex: 2]

  // スポーツ・アウトドア (上=野球, 上=ゴルフ ※下層はブラックリストのため両方上層から)
  "野球ボール",         // 野球／ゴルフ > 野球 [leafIndex: 2]
  "ゴルフウェア",       // 野球／ゴルフ > ゴルフ [leafIndex: 4]

  // ホーム・キッチン (上=調理器具, 下=タオル)
  "片手鍋",             // 調理器具／食皿 > 調理器具 [leafIndex: 1]
  "スポーツタオル",     // 布団／タオル > タオル [leafIndex: 3]

  // 食品・ドリンク (上=ソフトドリンク, 下=ケーキ)
  "お茶飲料（ペットボトル）", // 野菜／ソフトドリンク > ソフトドリンク [leafIndex: 3]
  "チョコレートケーキ", // スナック菓子／ケーキ > ケーキ [leafIndex: 3]
];

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

      // ブラックリストチェック: パスにブラックリスト項目が含まれていたらスキップ
      const isBlacklisted = CATEGORY_BLACKLIST.some(blacklisted =>
        currentPath.includes(blacklisted)
      );

      if (isBlacklisted) {
        return; // このカテゴリとその子孫をスキップ
      }

      // サブカテゴリがない場合、それをタスクのターゲットとする
      if (!cat.subcategories || cat.subcategories.length === 0) {
        // ホワイトリストチェック: ホワイトリストが設定されている場合、リストにある項目のみ追加
        if (TASK_WHITELIST.length > 0 && !TASK_WHITELIST.includes(cat.name)) {
          return; // ホワイトリストにない項目はスキップ
        }

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
 * 以下の条件を満たすようにシーケンスを生成します：
 * 1. 全10項目のホワイトリストから、各項目が必ず2回ずつ出現（計20試行）
 * 2. 同じ項目が連続して出現しない
 * 3. 5種類のイージング関数が各4回ずつ出現
 * 
 * @param participantId 参加者ID（数値）
 * @param availableTasks 利用可能な全タスクのリスト（ホワイトリスト適用済み）
 * @returns 試行順序、タスク、イージング関数のセット配列
 */
export const generateTaskSequence = (
  participantId: number,
  availableTasks: Task[]
): { trial: number; task: Task; easing: EasingFunction }[] => {
  const TOTAL_TRIALS = 20;

  // シード付き乱数生成器 (Linear Congruential Generator)
  let localSeed = participantId;
  const random = () => {
    localSeed = (localSeed * 9301 + 49297) % 233280;
    return localSeed / 233280;
  };

  // Fisher-Yates shuffle helper
  const shuffle = <T>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // 1. タスクリストの生成 (各項目2回ずつ)
  let taskPool: Task[] = [];

  // availableTasksが10個未満の場合は、20個になるように調整（基本は10個前提）
  if (availableTasks.length === 10) {
    // 10個の場合は各2回
    taskPool = [...availableTasks, ...availableTasks];
  } else if (availableTasks.length > 0) {
    // それ以外の場合はランダムに埋める（フォールバック）
    while (taskPool.length < TOTAL_TRIALS) {
      // 足りない分をavailableTasksから順番に追加
      taskPool.push(...availableTasks);
    }
    taskPool = taskPool.slice(0, TOTAL_TRIALS);
  }

  // 連続しないようにシャッフル (最大100回試行)
  let isValidSequence = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    shuffle(taskPool);
    isValidSequence = true;
    for (let i = 0; i < taskPool.length - 1; i++) {
      if (taskPool[i].id === taskPool[i + 1].id) {
        isValidSequence = false;
        break;
      }
    }
    if (isValidSequence) break;
  }

  // それでもダメなら、隣り合う重複を無理やり入れ替え
  if (!isValidSequence) {
    for (let i = 0; i < taskPool.length - 1; i++) {
      if (taskPool[i].id === taskPool[i + 1].id) {
        // 重複していない要素を探してスワップ
        for (let j = 0; j < taskPool.length; j++) {
          if (taskPool[j].id !== taskPool[i].id &&
            (j === 0 || taskPool[j - 1].id !== taskPool[i].id) &&
            (j === taskPool.length - 1 || taskPool[j + 1].id !== taskPool[i].id)) {
            [taskPool[i + 1], taskPool[j]] = [taskPool[j], taskPool[i + 1]];
            break;
          }
        }
      }
    }
  }

  // 2. イージングリストの生成 (5種類 × 4回)
  let easingPool: EasingFunction[] = [];
  EASING_FUNCS.forEach(easing => {
    for (let i = 0; i < 4; i++) easingPool.push(easing);
  });
  shuffle(easingPool);

  // 3. タスクとイージングを結合
  const sequence: { trial: number; task: Task; easing: EasingFunction }[] = [];
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    sequence.push({
      trial: i + 1,
      task: taskPool[i],
      easing: easingPool[i]
    });
  }

  return sequence;
};
