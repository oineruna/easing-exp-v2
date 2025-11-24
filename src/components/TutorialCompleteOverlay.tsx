import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface TutorialCompleteOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onClose: () => void;
}

export function TutorialCompleteOverlay({ isVisible, lang, onClose }: TutorialCompleteOverlayProps) {
  useEffect(() => {
    if (isVisible) {
      console.log("[TutorialCompleteOverlay] Visible");
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 背景 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 overlay-bg z-50"
          />

          {/* コンテンツ */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotate: -5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-effect rounded-3xl p-10 max-w-2xl w-full shadow-2xl text-center pointer-events-auto"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="text-7xl mb-6">🎉</motion.div>
              <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-3xl font-black mb-4 gradient-text">{t(lang, 'tutorialCompleted')}</motion.h2>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-700 mb-8 leading-relaxed text-lg bg-white/60 rounded-2xl p-6" dangerouslySetInnerHTML={{ __html: t(lang, 'tutorialCompletedText') }} />
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  console.log("[TutorialCompleteOverlay] Close clicked");
                  onClose();
                }}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 transition text-white rounded-2xl font-bold text-lg shadow-xl"
              >
                {t(lang, 'closeTutorial')} ✓
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
