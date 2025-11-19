import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { Category, EasingFunction } from "../types/experiment";

interface TaskMenuProps {
  categories: Category[];
  currentEasing: EasingFunction;
  onItemClick: (itemName: string) => void;
  isTutorial?: boolean;
  // アニメーション状態を親に伝えるためのコールバックがあると良いが、
  // 今回はTaskLoggerがグローバルではないため、簡易的に実装
}

// ベジェ曲線の定義
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
  onItemClick,
}) => {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  // カテゴリデータが変わったらメニューを閉じる(新しいタスク開始時など)
  useEffect(() => {
    setOpenMenus(new Set());
  }, [categories]);

  const handleClick = useCallback(
    (cat: Category, depth: number) => {
      // サブカテゴリがある場合は開閉のみ
      if (cat.subcategories && cat.subcategories.length > 0) {
        const key = `${cat.name}-${depth}`;
        setOpenMenus((prev) => {
          const newSet = new Set(prev);
          newSet.has(key) ? newSet.delete(key) : newSet.add(key);
          return newSet;
        });
      }
      // 末端アイテムの場合はクリックイベント発火
      onItemClick(cat.name);
    },
    [onItemClick]
  );

  // 再帰的にメニューを描画
  const renderMenu = (cats: Category[], depth = 0) => (
    <ul className="space-y-2">
      {cats.map((cat) => {
        const key = `${cat.name}-${depth}`;
        const isOpen = openMenus.has(key);
        const hasSub = cat.subcategories && cat.subcategories.length > 0;

        return (
          <li key={key} className="select-none">
            <motion.button
              onClick={() => handleClick(cat, depth)}
              whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.4)" }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full text-left px-4 py-3 rounded-xl flex items-center justify-between
                transition-all duration-200 border border-transparent
                ${
                  depth === 0
                    ? "bg-white/40 font-bold text-gray-800 shadow-sm"
                    : "text-gray-700 text-sm ml-3"
                }
                hover:border-white/50
              `}
            >
              <span className="flex items-center gap-2">
                {depth === 0 ? "📁" : "📄"} {cat.name}
              </span>
              {hasSub && (
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.4, ease: bezierMap[currentEasing] }}
                  className="text-gray-500 text-xs"
                >
                  ▶
                </motion.span>
              )}
            </motion.button>

            {hasSub && (
              <motion.div
                initial={false}
                animate={{
                  height: isOpen ? "auto" : 0,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{
                  height: { duration: 0.5, ease: bezierMap[currentEasing] },
                  opacity: { duration: 0.3 },
                }}
                className="overflow-hidden border-l-2 border-white/30 ml-4 mt-1"
              >
                <div className="pl-2 py-1">{renderMenu(cat.subcategories!, depth + 1)}</div>
              </motion.div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden bg-white/20 border-white/40 shadow-2xl rounded-2xl">
      {/* ヘッダー: 現在のイージング関数を表示(デバッグ兼フィードバック) */}
      <div className="p-4 bg-white/30 border-b border-white/20 backdrop-blur-md flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Current Mode
          </div>
          <div className="font-mono text-sm text-purple-700 font-bold">{currentEasing}</div>
        </div>

        {/* イージング可視化アイコン */}
        <div className="w-10 h-10 bg-white rounded-lg shadow-inner flex items-center justify-center relative overflow-hidden border border-gray-200">
          <motion.div
            animate={{
              x: [-12, 12],
              backgroundColor: ["#c084fc", "#f472b6"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: bezierMap[currentEasing],
            }}
            className="w-3 h-3 rounded-full"
          />
        </div>
      </div>

      {/* メニューリスト */}
      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
        {renderMenu(categories)}
      </div>
    </div>
  );
};
