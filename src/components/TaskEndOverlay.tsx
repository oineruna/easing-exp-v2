// --- START OF FILE src/components/TaskEndOverlay.tsx ---

import { motion, AnimatePresence } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../experiment";

interface TaskEndOverlayProps {
  isVisible: boolean;  // 表示状態
  lang: Lang;          // 言語設定
  isLastTask: boolean; // 最後のタスクかどうか（未使用ですが将来の拡張用）
  onContinue: () => void; // 「結果を見る」ボタン押下時のコールバック
}

/**
 * 全タスク終了時の完了画面コンポーネント
 * 実験の終了を伝え、結果画面への遷移を促します
 */
export function TaskEndOverlay({
  isVisible,
  lang,
  onContinue,
}: TaskEndOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl text-center"
          >
            {/* 結果画面へ進むボタン */}
            {/* ユーザーがすぐに押せるように上部に配置しています */}
            <div className="mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onContinue}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all"
              >
                {t(lang, "toResult")} ➜
              </motion.button>
            </div>

            {/* トロフィーアイコン */}
            <div className="text-6xl mb-4">🏆</div>

            {/* タイトル */}
            <h2 className="text-3xl font-black mb-4 text-gray-800">
              {t(lang, "taskEndTitle")}
            </h2>

            {/* 完了メッセージ */}
            <div
              className="text-gray-800 mb-4 leading-relaxed text-lg font-medium"
              dangerouslySetInnerHTML={{ __html: t(lang, "taskEndMessage") }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
