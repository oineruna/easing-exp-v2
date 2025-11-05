import { motion } from 'framer-motion';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface ConsentOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onAgree: () => void;
  onDisagree: () => void;
}

export function ConsentOverlay({ isVisible, lang, onAgree, onDisagree }: ConsentOverlayProps) {
  if (!isVisible) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-40 overlay-bg" 
      />
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative max-w-2xl w-full"
        >
          <div className="relative bg-white border border-gray-200 rounded-3xl p-10 shadow-xl">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center shadow"
            >
              <span className="text-4xl">📋</span>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-center mb-6 text-gray-800"
            >
              {t(lang, 'consentTitle')}
            </motion.h2>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 text-gray-700 leading-relaxed text-lg"
            >
              <div
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                dangerouslySetInnerHTML={{ __html: t(lang, 'consentText') }}
              />
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAgree}
              className="btn-primary"
            >
              ✓ {t(lang, 'agree')}
            </motion.button>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDisagree}
              className="btn-secondary"
            >
              ✗ {t(lang, 'disagree')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
