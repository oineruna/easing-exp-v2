import { motion } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../experiment";

interface ConsentOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onAgree: () => void;
  onDisagree: () => void;
  onLanguageChange: (lang: Lang) => void;
}

export function ConsentOverlay({
  isVisible,
  lang,
  onAgree,
  onDisagree,
  onLanguageChange,
}: ConsentOverlayProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* 背景 */}
      <div className="fixed inset-0 z-40" style={{ background: "#f5f5f5" }} />

      {/* ★ 修正: z-index を 60 に上げて、モーダルコンテナ(z-50)より手前に表示させる */}
      <div className="fixed top-4 right-4 z-[60] flex gap-2 bg-white p-1 rounded-lg shadow-md border border-gray-200">
        <button
          onClick={() => onLanguageChange("ja")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
            lang === "ja"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          日本語
        </button>
        <button
          onClick={() => onLanguageChange("en")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
            lang === "en"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          English
        </button>
      </div>

      {/* 中央カードコンテナ (これが画面全体を覆っている z-50) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* 
           pointer-events-none を親につけて、中のカードだけ auto にする方法もありますが、
           今回はボタンの z-index を上げたので、このままでもクリック可能です。
           念のためカード部分に pointer-events-auto を明示します。
        */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="relative max-w-2xl w-full pointer-events-auto"
        >
          <div className="relative bg-white border border-gray-200 rounded-3xl p-10 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* アイコン */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center shadow"
            >
              <span className="text-4xl">📋</span>
            </motion.div>

            {/* タイトル */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-center mb-6 text-gray-800"
            >
              {t(lang, "consentTitle")}
            </motion.h2>

            {/* 本文 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 text-gray-700 leading-relaxed text-lg"
            >
              <div
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                dangerouslySetInnerHTML={{ __html: t(lang, "consentText") }}
              />
            </motion.div>

            {/* ボタンエリア */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAgree}
              className="w-full relative rounded-2xl bg-blue-600 hover:bg-blue-700 transition text-white font-bold text-xl py-4"
            >
              ✓ {t(lang, "agree")}
            </motion.button>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              whileHover={{ scale: 1.02, y: -2 }}
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
