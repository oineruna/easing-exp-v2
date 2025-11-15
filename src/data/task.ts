import type { Task, Category } from "../types/experiment";

/**
 * 実験用タスク定義（15タスク = 5イージング × 3難易度）
 */

// カテゴリーデータ
const fashionCategory: Category = {
  name: "ファッション",
  subcategories: [
    { name: "メンズ靴" },
    { name: "レディース靴" },
    { name: "バッグ" },
    { name: "アクセサリー" },
  ],
};

const electronicsCategory: Category = {
  name: "家電・カメラ",
  subcategories: [
    {
      name: "カメラ",
      subcategories: [
        { name: "デジタル一眼" },
        { name: "コンパクトカメラ" },
        { name: "ミラーレス" },
      ],
    },
    {
      name: "テレビ",
      subcategories: [{ name: "4Kテレビ" }, { name: "有機EL" }],
    },
    { name: "オーディオ" },
    { name: "生活家電" },
  ],
};

const foodCategory: Category = {
  name: "食品・飲料",
  subcategories: [
    {
      name: "飲料",
      subcategories: [
        {
          name: "コーヒー",
          subcategories: [
            { name: "ドリップバッグ" },
            { name: "インスタント" },
            { name: "コーヒー豆" },
          ],
        },
        {
          name: "お茶",
          subcategories: [{ name: "緑茶" }, { name: "紅茶" }],
        },
      ],
    },
    {
      name: "お菓子",
      subcategories: [{ name: "チョコレート" }, { name: "クッキー" }],
    },
  ],
};

const sportsCategory: Category = {
  name: "スポーツ",
  subcategories: [
    {
      name: "アウトドア",
      subcategories: [
        { name: "テント" },
        { name: "寝袋" },
        { name: "バーベキュー用品" },
      ],
    },
    {
      name: "フィットネス",
      subcategories: [{ name: "ヨガマット" }, { name: "ダンベル" }],
    },
  ],
};

const booksCategory: Category = {
  name: "本・雑誌",
  subcategories: [
    {
      name: "書籍",
      subcategories: [
        {
          name: "小説",
          subcategories: [
            { name: "ミステリー" },
            { name: "SF" },
            { name: "恋愛小説" },
          ],
        },
        { name: "実用書" },
      ],
    },
    { name: "雑誌" },
  ],
};

/**
 * タスク定義（難易度別）
 */

// === 簡単タスク（2階層） ===
const easyTasks: Task[] = [
  {
    id: "easy-1",
    difficulty: "easy",
    targetPath: ["ファッション", "メンズ靴"],
    description: "「メンズ靴」を探してクリックしてください",
    categories: [fashionCategory, electronicsCategory, foodCategory],
  },
  {
    id: "easy-2",
    difficulty: "easy",
    targetPath: ["家電・カメラ", "オーディオ"],
    description: "「オーディオ」を探してクリックしてください",
    categories: [fashionCategory, electronicsCategory, foodCategory],
  },
  {
    id: "easy-3",
    difficulty: "easy",
    targetPath: ["スポーツ", "フィットネス", "ヨガマット"],
    description: "「ヨガマット」を探してクリックしてください",
    categories: [sportsCategory, booksCategory, fashionCategory],
  },
  {
    id: "easy-4",
    difficulty: "easy",
    targetPath: ["ファッション", "バッグ"],
    description: "「バッグ」を探してクリックしてください",
    categories: [fashionCategory, sportsCategory, electronicsCategory],
  },
  {
    id: "easy-5",
    difficulty: "easy",
    targetPath: ["本・雑誌", "雑誌"],
    description: "「雑誌」を探してクリックしてください",
    categories: [booksCategory, foodCategory, sportsCategory],
  },
];

// === 中程度タスク（3階層） ===
const mediumTasks: Task[] = [
  {
    id: "medium-1",
    difficulty: "medium",
    targetPath: ["家電・カメラ", "カメラ", "デジタル一眼"],
    description: "「デジタル一眼」を探してクリックしてください",
    categories: [electronicsCategory, foodCategory, sportsCategory],
  },
  {
    id: "medium-2",
    difficulty: "medium",
    targetPath: ["食品・飲料", "お菓子", "チョコレート"],
    description: "「チョコレート」を探してクリックしてください",
    categories: [foodCategory, fashionCategory, booksCategory],
  },
  {
    id: "medium-3",
    difficulty: "medium",
    targetPath: ["スポーツ", "アウトドア", "テント"],
    description: "「テント」を探してクリックしてください",
    categories: [sportsCategory, electronicsCategory, fashionCategory],
  },
  {
    id: "medium-4",
    difficulty: "medium",
    targetPath: ["家電・カメラ", "テレビ", "4Kテレビ"],
    description: "「4Kテレビ」を探してクリックしてください",
    categories: [electronicsCategory, foodCategory, booksCategory],
  },
  {
    id: "medium-5",
    difficulty: "medium",
    targetPath: ["食品・飲料", "飲料", "お茶", "緑茶"],
    description: "「緑茶」を探してクリックしてください",
    categories: [foodCategory, sportsCategory, fashionCategory],
  },
];

// === 難しいタスク（4階層） ===
const hardTasks: Task[] = [
  {
    id: "hard-1",
    difficulty: "hard",
    targetPath: ["食品・飲料", "飲料", "コーヒー", "ドリップバッグ"],
    description: "「ドリップバッグ」を探してクリックしてください",
    categories: [foodCategory, electronicsCategory, booksCategory],
  },
  {
    id: "hard-2",
    difficulty: "hard",
    targetPath: ["本・雑誌", "書籍", "小説", "ミステリー"],
    description: "「ミステリー」を探してクリックしてください",
    categories: [booksCategory, fashionCategory, sportsCategory],
  },
  {
    id: "hard-3",
    difficulty: "hard",
    targetPath: ["食品・飲料", "飲料", "コーヒー", "コーヒー豆"],
    description: "「コーヒー豆」を探してクリックしてください",
    categories: [foodCategory, sportsCategory, electronicsCategory],
  },
  {
    id: "hard-4",
    difficulty: "hard",
    targetPath: ["本・雑誌", "書籍", "小説", "SF"],
    description: "「SF」を探してクリックしてください",
    categories: [booksCategory, foodCategory, fashionCategory],
  },
  {
    id: "hard-5",
    difficulty: "hard",
    targetPath: ["食品・飲料", "飲料", "お茶", "紅茶"],
    description: "「紅茶」を探してクリックしてください",
    categories: [foodCategory, electronicsCategory, sportsCategory],
  },
];

/**
 * すべてのタスク
 */
export const ALL_TASKS = [...easyTasks, ...mediumTasks, ...hardTasks];

/**
 * 難易度別にタスクを取得
 */
export function getTasksByDifficulty(
  difficulty: "easy" | "medium" | "hard"
): Task[] {
  switch (difficulty) {
    case "easy":
      return easyTasks;
    case "medium":
      return mediumTasks;
    case "hard":
      return hardTasks;
  }
}

/**
 * ランダムにタスクを選択（各難易度から1つずつ）
 */
export function selectRandomTasks(): [Task, Task, Task] {
  const randomEasy = easyTasks[Math.floor(Math.random() * easyTasks.length)];
  const randomMedium =
    mediumTasks[Math.floor(Math.random() * mediumTasks.length)];
  const randomHard = hardTasks[Math.floor(Math.random() * hardTasks.length)];

  return [randomEasy, randomMedium, randomHard];
}

/**
 * ラテン方格に基づいてタスク順序を生成
 */
export function generateLatinSquareTasks(participantNumber: number): Task[] {
  const tasks: Task[] = [];
  const offset = participantNumber % 5;

  for (let i = 0; i < 5; i++) {
    const easingIndex = (i + offset) % 5;
    const [easy, medium, hard] = selectRandomTasks();

    // 各イージング関数で3タスク（easy, medium, hard）
    tasks.push(easy, medium, hard);
  }

  return tasks;
}
