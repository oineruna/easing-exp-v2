// --- START OF FILE src/components/TaskEndOverlay.tsx ---

import { motion, AnimatePresence } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../experiment";

interface TaskEndOverlayProps {
  isVisible: boolean;
  lang: Lang;
  isLastTask: boolean;
  onContinue: () => void;
}

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
            {/* Next Button moved to top */}
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

            <div className="text-6xl mb-4">🏆</div>

            <h2 className="text-3xl font-black mb-4 text-gray-800">
              {t(lang, "taskEndTitle")}
            </h2>

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
