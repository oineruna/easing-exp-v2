import type { Task } from '../types/experiment';

export const FIXED_TASKS_JA: Task[] = [
  { category: "スポーツ・アウトドア", subcat: "ゴルフ", item: "ゴルフボール" },
  { category: "日常食料品", subcat: "フルーツ", item: "りんご" },
  { category: "ペット日用品", subcat: "ペットフード", item: "ドッグフード" },
  { category: "園芸・ガーデン", subcat: "園芸用品", item: "植木鉢" },
  { category: "書籍・雑誌・漫画・児童書", subcat: "書籍", item: "小説" },
];

export const FIXED_TASKS_EN: Task[] = [
  { category: "Sports & Outdoors", subcat: "Golf", item: "Golf Balls" },
  { category: "Groceries", subcat: "Fruits", item: "Apple" },
  { category: "Pet Supplies", subcat: "Pet Food", item: "Dog Food" },
  { category: "Gardening & DIY", subcat: "Gardening Supplies", item: "Planters" },
  { category: "Books · Magazines · Comics · Picture Books", subcat: "Books", item: "Novels" },
];

export const LATIN_SQUARE = [
  [0, 1, 2, 3, 4],
  [1, 2, 3, 4, 0],
  [2, 3, 4, 0, 1],
  [3, 4, 0, 1, 2],
  [4, 0, 1, 2, 3],
];

export const EASING_FUNCS = ['linear', 'easeInOutQuad', 'easeInOutQuint', 'easeInOutExpo', 'easeInOutBack'] as const;

export const MAX_TASKS = 25;
export const TIME_LIMIT_MS = 15000;
