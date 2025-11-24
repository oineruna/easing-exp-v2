import { motion, AnimatePresence } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../experiment";

interface StartScreenProps {
  isVisible: boolean;
  lang: Lang;
  participantId: string;
  onStart: () => void;
  onTutorial: () => void;
}

export function StartScreen({
  isVisible,
  lang,
  participantId,
  onStart,
  onTutorial,
}: StartScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 背景 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 overlay-bg z-40"
          />

          {/* コンテンツ */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-effect rounded-3xl p-10 max-w-md w-full shadow-2xl pointer-events-auto"
            >
              {/* タイトル */}
              <motion.h2
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-black mb-8 text-center gradient-text"
              >
                {t(lang, "experimentStart")}
              </motion.h2>

              {/* ID表示 */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/60 rounded-2xl px-6 py-4 mb-8 text-center border border-gray-200"
              >
                <span className="text-sm text-gray-600 font-medium">ID: </span>
                <span className="text-xl font-bold text-gray-800">
                  {participantId}
                </span>
              </motion.div>

              {/* ボタン */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStart}
                  className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 transition text-white rounded-2xl font-bold text-lg shadow-xl"
                >
                  {t(lang, "startTask")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onTutorial}
                  className="w-full px-8 py-4 bg-white/80 hover:bg-white transition text-gray-700 rounded-2xl font-bold border-2 border-gray-300 shadow-md"
                >
                  {t(lang, "tutorialLabel")}
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
