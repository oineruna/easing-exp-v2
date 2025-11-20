import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, EasingFunction } from "../experiment";

interface TaskMenuProps {
  categories: Category[];
  currentEasing: EasingFunction;
  correctPath: string[];
  isTutorial: boolean;
  onItemClick: (itemName: string, isCorrectPath: boolean) => void;
}

// イージング関数の定義
const bezierMap: Record<EasingFunction, [number, number, number, number]> = {
  linear: [0.25, 0.25, 0.75, 0.75],
  easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
  easeInOutQuint: [0.86, 0, 0.07, 1],
  easeInOutExpo: [1, 0, 0, 1],
  easeInOutBack: [0.68, -0.55, 0.265, 1.55],
};

export const TaskMenu: React.FC<TaskMenuProps> = ({
  categories,
  currentEasing,
  correctPath,
  onItemClick,
}) => {
  const [activePath, setActivePath] = useState<string[]>([]);

  useEffect(() => {
    setActivePath([]);
  }, [categories]);

  const isInCorrectPath = useCallback(
    (itemName: string, depth: number): boolean => {
      if (!correctPath || correctPath.length === 0) return true;
      return correctPath[depth] === itemName;
    },
    [correctPath]
  );

  const handleClick = (cat: Category, depth: number) => {
    // 現在の階層より深いパスをクリアして更新
    const newPath = activePath.slice(0, depth);
    newPath[depth] = cat.name;
    setActivePath(newPath);

    const hasSub = cat.subcategories && cat.subcategories.length > 0;
    if (!hasSub) {
      const isCorrect = isInCorrectPath(cat.name, depth);
      onItemClick(cat.name, isCorrect);
    }
  };

  const renderMenu = (cats: Category[], depth = 0): React.ReactElement => {
    return (
      <ul
        className={`
          w-64 bg-white text-gray-700 text-sm font-medium
          /* 影をつけて浮き上がらせる */
          shadow-xl rounded-sm border border-gray-100
          /* 親要素（li）に対して相対配置ではなくなるが、ここでは枠のデザインのみ */
        `}
      >
        {cats.map((cat) => {
          const hasSub = cat.subcategories && cat.subcategories.length > 0;
          const isActive = activePath[depth] === cat.name;

          return (
            <li key={cat.name} className="relative">
              <button
                onClick={() => handleClick(cat, depth)}
                className={`
                  w-full text-left px-4 py-3.5 flex items-center justify-between
                  transition-colors duration-100 focus:outline-none
                  /* 親メニューの背景色。アクティブ時は薄い青 */
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <span className="truncate">{cat.name}</span>
                {hasSub && (
                  <span
                    className={`text-[10px] ml-2 ${
                      isActive ? "text-blue-500" : "text-gray-300"
                    }`}
                  >
                    ▶
                  </span>
                )}
              </button>

              <AnimatePresence>
                {hasSub && isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: bezierMap[currentEasing],
                    }}
                    // 重要変更点:
                    // 1. -z-10: 親メニューより奥（背面）に配置する
                    // 2. left-[98%]: 親メニューの右端より少し左から開始して、親の下に潜り込ませる
                    //    これにより親の影が子の上に落ちるようになる
                    className="absolute top-0 left-[98%] w-64 -z-10 pt-0"
                  >
                    {/* 再帰呼び出し */}
                    {renderMenu(cat.subcategories!, depth + 1)}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="relative inline-block align-top">
      {/* ヘッダー: z-indexを高くして一番手前に表示 */}
      <div className="relative z-20 bg-[#1a2332] text-white px-5 py-4 text-sm font-bold flex items-center gap-3 rounded-t-sm shadow-md w-64">
        <span className="text-xl leading-none">≡</span>
        <span className="tracking-wide">CATEGORY</span>
      </div>

      {/* メインメニュー */}
      <div className="relative z-10">
        <style>{`
          /* 最初のリストだけ上部の角丸とボーダーを調整してヘッダーと結合させる */
          ul:first-child {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-top: none;
          }
        `}</style>
        {renderMenu(categories)}
      </div>
    </div>
  );
};
