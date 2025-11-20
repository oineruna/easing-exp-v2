import { motion, AnimatePresence } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../utils/i18n";

interface NextTaskOverlayProps {
  isVisible: boolean;
  lang: Lang;
  nextTaskNumber: number;
  totalTasks: number;
  onNext: () => void;
}

export function NextTaskOverlay({
  isVisible,
  lang,
  nextTaskNumber,
  totalTasks,
  onNext,
}: NextTaskOverlayProps) {
  const labels = {
    ja: {
      title: "次のタスクへ進みます",
      button: "次へ",
      progress: `タスク ${nextTaskNumber} / ${totalTasks}`,
    },
    en: {
      title: "Proceed to Next Task",
      button: "Next",
      progress: `Task ${nextTaskNumber} / ${totalTasks}`,
    },
  };

  const text = labels[lang];

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
            <div className="text-sm font-bold text-blue-600 bg-blue-50 py-1 px-3 rounded-full inline-block mb-4">
              {text.progress}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              {text.title}
            </h2>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
              autoFocus
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-lg transition-all"
            >
              {text.button} →
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
