import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface TutorialCompleteOverlayProps {
  isVisible: boolean;  // 表示状態
  lang: Lang;          // 言語設定
  onClose: () => void; // 「実験を始める」ボタン押下時のコールバック
}

/**
 * チュートリアル完了画面コンポーネント
 * 練習が終わり、本番実験へ移行することをユーザーに伝えます
 */
export function TutorialCompleteOverlay({ isVisible, lang, onClose }: TutorialCompleteOverlayProps) {
  // デバッグ用ログ出力
  useEffect(() => {
    if (isVisible) {
      console.log("[TutorialCompleteOverlay] Visible");
    }
  }, [isVisible]);

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
              className="glass-effect rounded-3xl p-10 max-w-2xl w-full shadow-2xl text-center pointer-events-auto"
            >
              {/* 完了アイコン */}
              <div className="text-7xl mb-6">🎉</div>

              {/* タイトル */}
              <h2 className="text-3xl font-black mb-4 gradient-text">{t(lang, 'tutorialCompleted')}</h2>

              {/* 説明文 */}
              <div
                className="text-gray-700 mb-8 leading-relaxed text-lg bg-white/60 rounded-2xl p-6"
                dangerouslySetInnerHTML={{ __html: t(lang, 'tutorialCompletedText') }}
              />

              {/* 終了ボタン */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
