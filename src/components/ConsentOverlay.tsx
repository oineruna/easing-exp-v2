import { motion } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../experiment";

/**
 * 同意画面コンポーネントのProps定義
 */
interface ConsentOverlayProps {
  isVisible: boolean;                // 表示状態
  lang: Lang;                        // 現在の言語
  onAgree: () => void;               // 同意ボタン押下時のコールバック
  onDisagree: () => void;            // 同意しないボタン押下時のコールバック
  onLanguageChange: (lang: Lang) => void; // 言語切り替え時のコールバック
}

/**
 * 実験参加への同意を求めるオーバーレイコンポーネント
 * 実験の最初に表示され、同意が得られない場合は先に進めません
 */
export function ConsentOverlay({
  isVisible,
  lang,
  onAgree,
  onDisagree,
  onLanguageChange,
}: ConsentOverlayProps) {
  // 非表示の場合は何もレンダリングしない
  if (!isVisible) return null;

  return (
    <>
      {/* 背景オーバーレイ（半透明の黒） */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      {/* 言語切り替えボタンコンテナ */}
      {/* z-index を 60 に設定して、モーダルよりも手前に表示し操作可能にする */}
      <div className="fixed top-4 right-4 z-[60] flex gap-2 bg-white p-1 rounded-lg shadow-md border border-gray-200">
        {/* 日本語切り替えボタン */}
        <button
          onClick={() => onLanguageChange("ja")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${lang === "ja"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100"
            }`}
        >
          {t(lang, "langJa")}
        </button>
        {/* 英語切り替えボタン */}
        <button
          onClick={() => onLanguageChange("en")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${lang === "en"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100"
            }`}
        >
          {t(lang, "langEn")}
        </button>
      </div>

      {/* 中央カードコンテナ (画面全体を覆う z-50 レイヤー) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* 
           pointer-events-none を親につけて、中のカードだけ auto にすることで
           背景クリックを無効化しつつ、カード内の操作を有効にしています
        */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-2xl w-full pointer-events-auto"
        >
          {/* カード本体（グラスモーフィズムデザイン） */}
          <div className="relative glass-effect rounded-3xl p-10 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* アイコンアニメーション */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center shadow"
            >
              <span className="text-4xl">📋</span>
            </motion.div>

            {/* タイトル */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-black text-center mb-6 text-gray-800"
            >
              {t(lang, "consentTitle")}
            </motion.h2>

            {/* 同意書の本文 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8 text-gray-700 leading-relaxed text-lg"
            >
              <div
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                dangerouslySetInnerHTML={{ __html: t(lang, "consentText") }}
              />
            </motion.div>

            {/* 同意ボタン */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAgree}
              className="w-full relative rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white font-bold text-xl py-4 shadow-lg"
            >
              ✓ {t(lang, "agree")}
            </motion.button>

            {/* 同意しないボタン */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDisagree}
              className="w-full mt-4 relative rounded-2xl bg-gray-200 hover:bg-gray-300 transition text-gray-700 font-bold text-xl py-4"
            >
              ✗ {t(lang, "disagree")}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
