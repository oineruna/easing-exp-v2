import React, { useState, useCallback } from "react";
import { motion, Easing } from "framer-motion";
import type { Category, EasingFunction } from "../types/experiment";

interface TaskMenuProps {
  categories: Category[];
  currentEasing: EasingFunction;
  correctPath: string[];
  isTutorial: boolean;
  onItemClick: (itemName: string, isCorrectPath: boolean) => void;
}

const easingMap: Record<EasingFunction, Easing> = {
  linear: "linear",
  easeInOutQuad: "easeInOut",
  easeInOutQuint: "easeInOut",
  easeInOutExpo: "easeInOut",
  easeInOutBack: "easeInOut",
};

const depthConfig: Record<
  number,
  { icon: string; gradient: string; hover: string }
> = {
  0: {
    icon: "📁",
    gradient: "from-purple-500 to-pink-500",
    hover: "from-purple-600 to-pink-600",
  },
  1: {
    icon: "📂",
    gradient: "from-blue-500 to-cyan-500",
    hover: "from-blue-600 to-cyan-600",
  },
  2: {
    icon: "📄",
    gradient: "from-emerald-500 to-teal-500",
    hover: "from-emerald-600 to-teal-600",
  },
};

export const TaskMenu: React.FC<TaskMenuProps> = ({
  categories,
  currentEasing,
  correctPath,
  isTutorial: _isTutorial,
  onItemClick,
}) => {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isInCorrectPath = useCallback(
    (itemName: string, depth: number): boolean => {
      if (!correctPath || correctPath.length === 0) return true;
      return correctPath[depth] === itemName;
    },
    [correctPath]
  );

  const handleClick = useCallback(
    (cat: Category, depth: number) => {
      const menuKey = `${cat.name}-${depth}`;
      const hasSubcategories =
        cat.subcategories && cat.subcategories.length > 0;

      if (hasSubcategories) {
        setOpenMenus((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(menuKey)) {
            newSet.delete(menuKey);
          } else {
            newSet.add(menuKey);
          }
          return newSet;
        });
        const isCorrect = isInCorrectPath(cat.name, depth);
        onItemClick(cat.name, isCorrect);
      } else {
        onItemClick(cat.name, true);
      }
    },
    [isInCorrectPath, onItemClick]
  );

  const renderMenu = useCallback(
    (cats: Category[], depth = 0): React.ReactElement[] => {
      const config = depthConfig[depth] || depthConfig[2];

      return cats.map((cat) => {
        const menuKey = `${cat.name}-${depth}`;
        const isOpen = openMenus.has(menuKey);
        const hasSubcategories =
          cat.subcategories && cat.subcategories.length > 0;
        const isHovered = hoveredItem === menuKey;

        return (
          <li key={menuKey} className="relative">
            {/* メニューボタン */}
            <motion.button
              onClick={() => handleClick(cat, depth)}
              onMouseEnter={() => setHoveredItem(menuKey)}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full text-left px-5 py-3.5 rounded-xl mb-2 
                font-semibold text-sm transition-all duration-200
                relative overflow-hidden text-white shadow-md
                bg-gradient-to-r ${isHovered ? config.hover : config.gradient}
              `}
            >
              {/* 光沢エフェクト */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: isHovered ? "200%" : "-100%" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />

              {/* コンテンツ */}
              <span className="relative z-10 flex items-center justify-between">
                <span className="truncate flex items-center gap-2.5">
                  <span className="text-base">{config.icon}</span>
                  <span className="tracking-wide">{cat.name}</span>
                </span>
                {hasSubcategories && (
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{
                      duration: 0.3,
                      ease: easingMap[currentEasing] as any,
                    }}
                    className="text-lg ml-2 opacity-90"
                  >
                    ▶
                  </motion.span>
                )}
              </span>

              {/* ボトムライン */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/40"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            {/* サブメニュー（アコーディオン） */}
            {hasSubcategories && (
              <motion.div
                initial={false}
                animate={{
                  height: isOpen ? "auto" : 0,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{
                  height: {
                    duration: 0.5,
                    ease: easingMap[currentEasing],
                  },
                  opacity: {
                    duration: 0.3,
                    ease: "easeInOut",
                  },
                }}
                className="overflow-hidden"
              >
                <ul
                  className={`
                  list-none pl-6 pr-2 pb-2 space-y-1
                  ${depth === 0 ? "bg-white/20 rounded-xl p-3 mb-2" : ""}
                `}
                >
                  {renderMenu(cat.subcategories!, depth + 1)}
                </ul>
              </motion.div>
            )}
          </li>
        );
      });
    },
    [openMenus, currentEasing, handleClick, hoveredItem]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {/* 外側のグロー */}
      <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30 rounded-3xl blur-2xl opacity-60"></div>

      {/* メインコンテナ */}
      <div className="relative w-[420px] bg-white/97 backdrop-blur-2xl rounded-2xl p-5 shadow-2xl border-2 border-white/70">
        {/* ヘッダー */}
        <div className="mb-4 pb-3 border-b-2 border-gray-100">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span>カテゴリー</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 ml-8">
            商品を見つけてクリックしてください
          </p>
        </div>

        {/* メニューリスト */}
        <ul className="list-none p-0 m-0 space-y-1">
          {renderMenu(categories)}
        </ul>

        {/* フッター */}
        <div className="mt-4 pt-3 border-t-2 border-gray-100">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>✨</span>
            <span>クリックして展開</span>
            <span>✨</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
