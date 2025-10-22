import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface TutorialCompleteOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onClose: () => void;
}

export function TutorialCompleteOverlay({ isVisible, lang, onClose }: TutorialCompleteOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-8 max-w-2xl mx-4 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">
              {t(lang, 'tutorialCompleted')}
            </h2>
            <div
              className="text-gray-700 mb-6 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t(lang, 'tutorialCompletedText') }}
            />
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition-all"
            >
              {t(lang, 'closeTutorial')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
