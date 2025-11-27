// --- START OF FILE src/components/NextTaskOverlay.tsx ---

import { motion, AnimatePresence } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../experiment";

interface NextTaskOverlayProps {
  isVisible: boolean;      // 表示状態
  lang: Lang;              // 言語設定
  nextTaskNumber: number;  // 次のタスク番号
  totalTasks: number;      // 総タスク数
  onNext: () => void;      // 「次へ」ボタン押下時のコールバック
}

/**
 * 次のタスクへの移行画面コンポーネント
 * タスク間の休憩ポイントとして機能し、ユーザーの準備が整ってから次へ進めるようにします
 */
export function NextTaskOverlay({
  isVisible,
  lang,
  nextTaskNumber,
  totalTasks,
  onNext,
}: NextTaskOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-10 shadow-2xl border border-gray-100 text-center max-w-md w-full"
          >
            {/* 進捗表示バッジ */}
            <div className="text-sm font-bold text-blue-600 bg-blue-50 py-1 px-3 rounded-full inline-block mb-4">
              {t(lang, "nextTaskProgress", nextTaskNumber, totalTasks)}
            </div>

            {/* タイトル */}
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              {t(lang, "nextTaskTitle")}
            </h2>

            {/* 次へ進むボタン */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
              autoFocus // 自動的にフォーカスを当ててEnterキーで進めるようにする
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-lg transition-all"
            >
              {t(lang, "nextTaskButton")} →
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
