import { motion } from 'framer-motion';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface ConsentOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onAgree: () => void;
}

export function ConsentOverlay({ isVisible, lang, onAgree }: ConsentOverlayProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* 🎨 背景レイヤー（独立） */}
      <div className="fixed inset-0 z-40" style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 15s ease infinite'
      }}>
        {/* Blob効果 */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute w-96 h-96 bg-white rounded-full filter blur-3xl"
            style={{
              top: '25%',
              left: '25%',
              mixBlendMode: 'overlay',
              animation: 'blob 7s infinite'
            }}
          />
          <div 
            className="absolute w-96 h-96 bg-purple-300 rounded-full filter blur-3xl"
            style={{
              top: '33%',
              right: '25%',
              mixBlendMode: 'overlay',
              animation: 'blob 7s infinite',
              animationDelay: '2s'
            }}
          />
          <div 
            className="absolute w-96 h-96 bg-pink-300 rounded-full filter blur-3xl"
            style={{
              bottom: '25%',
              left: '50%',
              mixBlendMode: 'overlay',
              animation: 'blob 7s infinite',
              animationDelay: '4s'
            }}
          />
        </div>
      </div>

      {/* コンテンツレイヤー */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative max-w-2xl w-full"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-2xl opacity-75 animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 shadow-2xl">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <span className="text-4xl">📋</span>
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-center mb-6 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent"
            >
              {t(lang, 'consentTitle')}
            </motion.h2>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 text-gray-100 leading-relaxed text-lg"
            >
              <div
                className="bg-white/5 rounded-xl p-4 border border-white/10"
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
              className="w-full relative group overflow-hidden rounded-2xl p-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
            >
              <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl px-8 py-5 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:via-pink-500 group-hover:to-blue-500 transition-all duration-300">
                <span className="text-white font-bold text-xl flex items-center justify-center gap-3">
                  ✓ {t(lang, 'agree')}
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
