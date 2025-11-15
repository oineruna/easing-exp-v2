import React, { useState, useCallback } from 'react';
import { motion, Easing } from 'framer-motion';
import type { Category, EasingFunction } from '../types/experiment';

interface TaskMenuProps {
  categories: Category[];
  currentEasing: EasingFunction;
  correctPath: string[];
  isTutorial: boolean;
  onItemClick: (itemName: string, isCorrectPath: boolean) => void;
}

const easingMap: Record<EasingFunction, Easing> = {
  linear: 'linear',
  easeInOutQuad: 'easeInOut',
  easeInOutQuint: 'easeInOut',
  easeInOutExpo: 'easeInOut',
  easeInOutBack: 'easeInOut',
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
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;

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
      return cats.map((cat) => {
        const menuKey = `${cat.name}-${depth}`;
        const isOpen = openMenus.has(menuKey);
        const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
        const isHovered = hoveredItem === menuKey;

        return (
          <li key={menuKey} className="relative">
            {/* メニュー項目 */}
            <motion.button
              onClick={() => handleClick(cat, depth)}
              onMouseEnter={() => setHoveredItem(menuKey)}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={{ x: 2 }}
              className={`
                w-full text-left px-4 py-3 
                font-medium text-sm transition-all duration-150
                relative group
                ${isHovered ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}
                ${depth === 0 ? 'border-b border-gray-200' : ''}
              `}
            >
              <span className="flex items-center justify-between text-gray-800">
                <span className="flex items-center gap-2">
                  {hasSubcategories && (
                    <motion.span
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{
                        duration: 0.2,
                        ease: easingMap[currentEasing] as any,
                      }}
                      className="text-gray-500"
                    >
                      ▶
                    </motion.span>
                  )}
                  <span>{cat.name}</span>
                </span>
                {hasSubcategories && depth === 0 && (
                  <span className="text-gray-400 text-xs">›</span>
                )}
              </span>
            </motion.button>

            {/* サブメニュー（右側にフライアウト） */}
            {hasSubcategories && depth === 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  x: isOpen ? 0 : -10,
                }}
                transition={{
                  duration: 0.3,
                  ease: easingMap[currentEasing],
                }}
                className={`
                  absolute left-full top-0 ml-2 w-64
                  bg-white border border-gray-200 rounded-lg shadow-xl
                  ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
                `}
                style={{ zIndex: 100 }}
              >
                {/* サブメニューヘッダー */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                  <h4 className="font-bold text-sm text-gray-800">{cat.name}</h4>
                </div>

                {/* サブメニューリスト */}
                <ul className="py-2 max-h-96 overflow-y-auto">
                  {renderMenu(cat.subcategories!, depth + 1)}
                </ul>
              </motion.div>
            )}

            {/* 第2階層以降のサブメニュー（アコーディオン） */}
            {hasSubcategories && depth > 0 && (
              <motion.div
                initial={false}
                animate={{
                  height: isOpen ? 'auto' : 0,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{
                  height: {
                    duration: 0.3,
                    ease: easingMap[currentEasing],
                  },
                  opacity: {
                    duration: 0.2,
                  },
                }}
                className="overflow-hidden bg-gray-50"
              >
                <ul className="pl-6 py-1">
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
    <div className="relative w-72">
      {/* メインメニューコンテナ */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h3 className="font-bold text-base flex items-center gap-2">
            <span>📦</span>
            <span>すべてのカテゴリー</span>
          </h3>
        </div>

        {/* メニューリスト */}
        <ul className="list-none p-0 m-0">
          {renderMenu(categories)}
        </ul>
      </div>
    </div>
  );
};
