import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import type { Category, EasingFunction } from '../types/experiment';  // 🔥 type キーワード追加

interface TaskMenuProps {
  categories: Category[];
  currentEasing: EasingFunction;
  correctPath: string[];
  isTutorial: boolean;
  onItemClick: (itemName: string, isCorrectPath: boolean) => void;
}

const easingMap: Record<EasingFunction, [number, number, number, number]> = {
  linear: [0.25, 0.25, 0.75, 0.75],
  easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
  easeInOutQuint: [0.86, 0, 0.07, 1],
  easeInOutExpo: [1, 0, 0, 1],
  easeInOutBack: [0.68, -0.55, 0.265, 1.55],
};

export function TaskMenu({ categories, currentEasing, correctPath, isTutorial: _isTutorial, onItemClick }: TaskMenuProps) {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const isInCorrectPath = useCallback((itemName: string, depth: number): boolean => {
    if (!correctPath || correctPath.length === 0) return true;
    return correctPath[depth] === itemName;
  }, [correctPath]);

  const handleClick = useCallback((cat: Category, depth: number) => {
    const menuKey = `${cat.name}-${depth}`;
    const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;

    if (hasSubcategories) {
      setOpenMenus(prev => {
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
  }, [isInCorrectPath, onItemClick]);

  const renderMenu = useCallback((cats: Category[], depth = 0): React.ReactElement[] => {
    return cats.map((cat, index) => {
      const menuKey = `${cat.name}-${depth}`;
      const isOpen = openMenus.has(menuKey);
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;

      return (
        <li key={`${cat.name}-${index}`} className="relative">
          <button
            onClick={() => handleClick(cat, depth)}
            className="w-full text-left px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-sm mb-0.5 hover:from-blue-700 hover:to-blue-700 transition-colors font-medium text-base whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {cat.name}
          </button>

          {hasSubcategories && (
            <motion.ul
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : -20,
              }}
              transition={{
                ease: easingMap[currentEasing],
                duration: 0.8,
              }}
              className={`absolute top-0 left-full w-52 bg-white shadow-lg ${
                isOpen ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              style={{ marginLeft: '0px' }}
            >
              {renderMenu(cat.subcategories!, depth + 1)}
            </motion.ul>
          )}
        </li>
      );
    });
  }, [openMenus, currentEasing, handleClick]);

  return (
    <div className="w-80 mx-auto p-2.5 shadow-lg rounded bg-white">
      <ul className="list-none p-0 m-0">
        {renderMenu(categories)}
      </ul>
    </div>
  );
}
