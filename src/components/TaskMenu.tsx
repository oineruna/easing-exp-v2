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
          w-72 bg-white text-gray-800
          shadow-lg border border-gray-200
          ${depth === 0 ? 'rounded-b-md' : 'rounded-md'}
        `}
      >
        {cats.map((cat) => {
          const hasSub = cat.subcategories && cat.subcategories.length > 0;
          const isActive = activePath[depth] === cat.name;

          return (
            <li key={cat.name} className="relative border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => handleClick(cat, depth)}
                className={`
                  w-full text-left px-5 py-4 flex items-center justify-between
                  transition-all duration-150 focus:outline-none
                  text-base font-medium
                  ${isActive
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-800"
                  }
                `}
              >
                <span className="truncate">{cat.name}</span>
                {hasSub && (
                  <svg
                    className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${isActive ? 'rotate-0' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              <AnimatePresence>
                {hasSub && isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.80,
                      ease: bezierMap[currentEasing],
                    }}
                    className="absolute top-0 left-full -z-10"
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
      {/* ヘッダー */}
      <div className="relative z-20 bg-gradient-to-r from-gray-700 to-gray-800 text-white px-5 py-3.5 font-semibold flex items-center gap-3 rounded-t-md shadow-md w-72">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="tracking-wide text-sm uppercase">カテゴリー</span>
      </div>

      {/* メインメニュー */}
      <div className="relative z-10">
        {renderMenu(categories)}
      </div>
    </div>
  );
};
