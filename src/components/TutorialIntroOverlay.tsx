import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface TutorialIntroOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onClose: () => void;
}

export function TutorialIntroOverlay({ isVisible, lang, onClose }: TutorialIntroOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 overlay-bg flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="glass-effect rounded-3xl p-8 max-w-4xl w-full shadow-2xl">
            <motion.h2 initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl font-black mb-6 text-center gradient-text">
              📚 {lang === 'ja' ? 'チュートリアル' : 'Tutorial'}
            </motion.h2>
            <motion.img initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} src="/tutorial.png" alt="Tutorial" className="max-w-full h-auto rounded-2xl mb-6 shadow-lg" />
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-gray-700 mb-6 leading-relaxed text-lg text-center bg-white/60 rounded-2xl p-6" dangerouslySetInnerHTML={{ __html: t(lang, 'tutorialIntroText') }} />
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl">
                {t(lang, 'tutorialIntroClose')} ▶
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
