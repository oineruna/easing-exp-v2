import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface ConsentOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onAgree: () => void;
  onDisagree: () => void;
}

export function ConsentOverlay({ isVisible, lang, onAgree, onDisagree }: ConsentOverlayProps) {
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
            className="bg-white rounded-lg p-8 max-w-2xl min-w-[400px] mx-4"
          >
            <h2 className="text-2xl font-bold mb-4 text-center">
              {t(lang, 'consentTitle')}
            </h2>
            <div
              className="mb-6 text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t(lang, 'consentText') }}
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={onAgree}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition-all"
              >
                {t(lang, 'agree')}
              </button>
              <button
                onClick={onDisagree}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition-all"
              >
                {t(lang, 'disagree')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
