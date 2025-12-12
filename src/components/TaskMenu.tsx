import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, EasingFunction } from "../experiment";

interface TaskMenuProps {
  categories: Category[];           // メニューデータの配列
  currentEasing: EasingFunction;    // 現在適用するイージング関数
  correctPath: string[];            // 正解のパス（デバッグやハイライト用）
  isTutorial: boolean;              // チュートリアルモードかどうか
  onItemClick: (itemName: string, isCorrectPath: boolean, depth: number, isLeaf: boolean) => void; // アイテムクリック時のコールバック
  onAnimationChange?: (isAnimating: boolean) => void; // アニメーション状態変更時のコールバック
  animationDuration?: number;       // アニメーション時間（秒）
  slideDistance?: number;           // スライド距離（px）
}

// イージング関数のベジェ曲線定義マップ
// CSSの cubic-bezier() に渡すパラメータです
import { getEasingBezier } from "../utils/easings";

// イージング関数のベジェ曲線定義マップ
// CSSの cubic-bezier() に渡すパラメータです
// const bezierMap は削除し、getEasingBezier を使用します

/**
 * 多階層ドリルダウンメニューコンポーネント
 * 実験のメインとなる操作対象です
 * 再帰的にサブメニューを展開します
 */
export const TaskMenu: React.FC<TaskMenuProps> = ({
  categories,
  currentEasing,
  correctPath,
  onItemClick,
  onAnimationChange,
  animationDuration = 0.8, // デフォルト値
  slideDistance = 50,      // デフォルト値
}) => {
  // 現在展開されているパスの状態管理
  const [activePath, setActivePath] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズ監視
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // カテゴリデータが変更されたらパスをリセット
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
    // モバイルの場合はトグル動作、デスクトップは階層切り替え
    if (isMobile) {
      const isActive = activePath[depth] === cat.name;
      const newPath = activePath.slice(0, depth);
      if (!isActive) {
        newPath[depth] = cat.name;
      }
      setActivePath(newPath);
    } else {
      const newPath = activePath.slice(0, depth);
      newPath[depth] = cat.name;
      setActivePath(newPath);
    }

    const hasSub = cat.subcategories && cat.subcategories.length > 0;

    // 全てのクリックを親に通知（エラー判定のため）
    const isCorrect = isInCorrectPath(cat.name, depth);
    onItemClick(cat.name, isCorrect, depth, !hasSub);
  };

  const renderMenu = (cats: Category[], depth = 0): React.ReactElement => {
    return (
      <ul
        className={`
          bg-white text-gray-800
          ${isMobile
            ? 'w-full border-l-2 border-gray-100'
            : `w-72 shadow-lg border border-gray-200 ${depth === 0 ? 'rounded-b-md' : 'rounded-md'}`
          }
        `}
      >
        {cats.map((cat) => {
          const hasSub = cat.subcategories && cat.subcategories.length > 0;
          const isActive = activePath[depth] === cat.name;

          return (
            <li key={cat.name} className={`relative ${!isMobile && 'border-b border-gray-100 last:border-b-0'}`}>
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
                  ${isMobile && depth > 0 ? 'pl-8' : ''}
                `}
              >
                <span className="truncate">{cat.name}</span>
                {hasSub && (
                  <svg
                    className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${isActive ? 'rotate-90 md:rotate-0' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isMobile ? "M9 5l7 7-7 7" : "M9 5l7 7-7 7"} />
                  </svg>
                )}
              </button>

              <AnimatePresence>
                {hasSub && isActive && (
                  <motion.div
                    initial={isMobile ? { height: 0, opacity: 0 } : { opacity: 0, x: -slideDistance }} // 透明度変化を戻す
                    animate={isMobile ? { height: "auto", opacity: 1 } : { opacity: 1, x: 0 }}
                    exit={isMobile ? { height: 0, opacity: 0 } : { opacity: 0 }}
                    transition={{
                      duration: animationDuration,
                      ease: getEasingBezier(currentEasing),
                    }}
                    onAnimationStart={() => onAnimationChange?.(true)}
                    onAnimationComplete={() => onAnimationChange?.(false)}
                    className={isMobile ? "overflow-hidden" : "absolute top-0 left-full -z-10"}
                  >
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

  // クリックアウトサイド（メニュー外クリックで閉じる）の実装
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActivePath([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className={`relative inline-block align-top ${isMobile ? 'w-full' : ''}`}>
      <div className={`
        relative z-20 bg-gradient-to-r from-gray-700 to-gray-800 text-white px-5 py-3.5 
        font-semibold flex items-center gap-3 rounded-t-md shadow-md
        ${isMobile ? 'w-full' : 'w-72'}
      `}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="tracking-wide text-sm uppercase">カテゴリー</span>
      </div>

      <div className="relative z-10">
        {renderMenu(categories)}
      </div>
    </div>
  );
};
