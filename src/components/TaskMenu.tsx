import { motion, Easing } from 'framer-motion';
import { useState, useCallback } from 'react';
import type { Category, EasingFunction } from '../types/experiment';

interface TaskMenuProps {
  categories: Category[];
  currentEasing: EasingFunction;
  correctPath: string[];
  isTutorial: boolean;
  onItemClick: (itemName: string, isCorrectPath: boolean) => void;
}

// Framer Motionで認識されるeasing名のみを使用
const easingMap: Record<EasingFunction, Easing> = {
  linear: 'linear',
  easeInOutQuad: 'easeInOut',
  easeInOutQuint: 'easeInOut',
  easeInOutExpo: 'easeInOut',
  easeInOutBack: 'easeInOut',
};

export function TaskMenu({ categories, currentEasing, correctPath, isTutorial: _isTutorial, onItemClick }: TaskMenuProps) {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isInCorrectPath = useCallback((itemName: string, depth: number): boolean => {
    if (!correctPath || correctPath.length === 0) return true;
    return correctPath[depth] === itemName;
  }, [correctPath]);

  const handleClick = useCallback((cat: Category, depth: number) => {
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
  }, [isInCorrectPath, onItemClick]);

  const renderMenu = useCallback((cats: Category[], depth = 0): React.ReactElement[] => {
    return cats.map((cat) => {
      const menuKey = `${cat.name}-${depth}`;
      const isOpen = openMenus.has(menuKey);
      const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
      const isHovered = hoveredItem === menuKey;

      return (
        <li key={menuKey} className="relative">
          <motion.button
            onClick={() => handleClick(cat, depth)}
            onMouseEnter={() => setHoveredItem(menuKey)}
            onMouseLeave={() => setHoveredItem(null)}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            style={{ background: depth === 0 ? 'var(--gradient-primary)' : 'var(--gradient-secondary)' }}
            className="w-full text-left px-6 py-4 rounded-xl mb-2 font-semibold text-base transition-all duration-300 relative overflow-hidden group text-white shadow-lg"
          >
            {/* シマーエフェクトを追加 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
              initial={{ x: '-100%' }}
              animate={{ x: isHovered ? '100%' : '-100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <span className="relative z-10 flex items-center justify-between">
              <span className="truncate flex items-center gap-2">
                {depth === 0 && <span className="text-lg">📁</span>}
                {cat.name}
              </span>
              {hasSubcategories && (
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                  className="text-xl ml-2"
                >
                  ▶
                </motion.span>
              )}
            </span>
          </motion.button>

          {hasSubcategories && (
            <motion.ul
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : -20,
                scale: isOpen ? 1 : 0.95,
              }}
              transition={{
                ease: easingMap[currentEasing],
                duration: 0.8,
              }}
              className={`
                absolute top-0 left-full w-64 ml-3
                bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl
                border border-white/50 overflow-hidden
                ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
              `}
            >
              <div className="p-2">
                {renderMenu(cat.subcategories!, depth + 1)}
              </div>
            </motion.ul>
          )}
        </li>
      );
    });
  }, [openMenus, currentEasing, handleClick, hoveredItem]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* グロー効果を追加 */}
      <div className="absolute -inset-1 rounded-2xl blur-xl opacity-75" style={{ background: 'var(--gradient-primary)' }}></div>

      <div className="relative w-[380px] bg-white/95 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-white/50">
        <ul className="list-none p-0 m-0 space-y-1">
          {renderMenu(categories)}
        </ul>
      </div>
    </motion.div>
  );
}
