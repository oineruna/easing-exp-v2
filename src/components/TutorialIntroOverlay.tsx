import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface TutorialIntroOverlayProps {
  isVisible: boolean; // 表示状態
  lang: Lang;         // 言語設定
  onClose: () => void; // 「始める」ボタン押下時のコールバック
}

/**
 * チュートリアル開始前の説明画面コンポーネント
 * チュートリアルの目的と操作方法を説明します
 */
export function TutorialIntroOverlay({ isVisible, lang, onClose }: TutorialIntroOverlayProps) {
  // チュートリアル画像（説明図）のプリロード
  // 表示時の遅延を防ぐためにコンポーネントマウント時に読み込みを開始します
  useEffect(() => {
    const img = new Image();
    img.src = "/tutorial.png";
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 背景オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 overlay-bg z-50"
          />

          {/* コンテンツコンテナ */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-effect rounded-3xl p-8 max-w-4xl w-full shadow-2xl pointer-events-auto"
            >
              {/* タイトル */}
              <motion.h2 className="text-3xl font-black mb-6 text-center gradient-text flex items-center justify-center">
                <span className="emoji-not-gradient text-3xl mr-2" style={{
                  background: 'none',
                  WebkitBackgroundClip: 'initial',
                  WebkitTextFillColor: '#a846ce',
                  color: '#a846ce'
                }}>
                  📚
                </span>
                {lang === 'ja' ? 'チュートリアル' : 'Tutorial'}
              </motion.h2>

              {/* 説明画像 */}
              <motion.img
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                src="/tutorial.png"
                alt="Tutorial"
                className="max-w-2xl w-full h-auto rounded-2xl mb-6 shadow-lg mx-auto"
              />

              {/* 説明文 */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-700 mb-6 leading-relaxed text-lg text-center bg-white/60 rounded-2xl p-6"
                dangerouslySetInnerHTML={{ __html: t(lang, 'tutorialIntroText') }}
              />

              {/* 開始ボタン */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-700 transition text-white rounded-2xl font-bold text-lg shadow-xl"
                >
                  {t(lang, 'tutorialIntroClose')} ▶
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
