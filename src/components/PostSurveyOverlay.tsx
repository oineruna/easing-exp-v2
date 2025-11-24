// --- START OF FILE src/components/PostSurveyOverlay.tsx ---

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { t } from "../utils/i18n";
import type { Lang, PostSurveyResult } from "../experiment";

interface PostSurveyOverlayProps {
  isVisible: boolean;
  lang: Lang;
  participantId: string;
  onComplete: (data: PostSurveyResult) => void;
}

export function PostSurveyOverlay({
  isVisible,
  lang,
  participantId,
  onComplete,
}: PostSurveyOverlayProps) {
  const [noticeDifference, setNoticeDifference] = useState<string>("");
  const [usabilityImpact, setUsabilityImpact] = useState<string[]>([]);
  const [usabilityImpactOther, setUsabilityImpactOther] = useState<string>("");
  const [bestFeature, setBestFeature] = useState<string>("");
  const [worstFeature, setWorstFeature] = useState<string>("");
  const [improvements, setImprovements] = useState<string>("");

  // i18nから選択肢配列を取得
  const q2Options: string[] = t(lang, "postSurveyQ2Options");
  const impactOptions: string[] = t(lang, "postSurveyQ3Options");
  const featureOptions: string[] = t(lang, "postSurveyFeatureOptions");

  // "その他" / "Other" の判定用 (配列の最後の要素と仮定するか、文字列で判定)
  // ここでは文字列一致で判定します（i18nファイルの内容と合わせる必要があります）
  const otherOptionLabel = lang === "en" ? "Other" : "その他";

  const handleImpactChange = (option: string) => {
    if (usabilityImpact.includes(option)) {
      setUsabilityImpact(usabilityImpact.filter((item) => item !== option));
    } else {
      setUsabilityImpact([...usabilityImpact, option]);
    }
  };

  const handleSubmit = () => {
    // バリデーション
    if (
      !noticeDifference ||
      usabilityImpact.length === 0 ||
      !bestFeature ||
      !worstFeature
    ) {
      alert(t(lang, "postSurveyAlert"));
      return;
    }

    const result: PostSurveyResult = {
      participantId,
      noticeDifference,
      usabilityImpact,
      usabilityImpactOther,
      bestFeature,
      worstFeature,
      improvements,
    };

    onComplete(result);
  };

  // ★ デバッグ用スキップ
  const handleDebugSkip = () => {
    const dummyResult: PostSurveyResult = {
      participantId,
      noticeDifference: q2Options[0],
      usabilityImpact: [impactOptions[0]],
      usabilityImpactOther: "",
      bestFeature: featureOptions[0],
      worstFeature: featureOptions[0],
      improvements: "Debug Skip",
    };
    onComplete(dummyResult);
  };

  // ★ デバッグ用スキップ (Shift + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "Enter") {
        handleDebugSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col"
          >
            <h2 className="text-3xl font-black text-gray-800 mt-6 mb-2 flex items-center justify-center">
              <span className="text-2xl mr-2">📋</span>
              事後アンケート
            </h2>

            <div className="space-y-8 text-left pb-4">
              {/* Q1: ID */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-2">
                  {t(lang, "postSurveyQ1")}
                </label>
                <input
                  type="text"
                  value={participantId}
                  readOnly
                  className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg text-gray-600 font-mono cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t(lang, "postSurveyQ1Note")}
                </p>
              </div>

              {/* Q2: 違いに気づいたか */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-3">
                  {t(lang, "postSurveyQ2")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1">
                  {q2Options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition"
                    >
                      <input
                        type="radio"
                        name="q2_notice"
                        value={opt}
                        checked={noticeDifference === opt}
                        onChange={(e) => setNoticeDifference(e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q3: 影響 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-3">
                  {t(lang, "postSurveyQ3")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1">
                  {impactOptions.map((opt) => (
                    <div key={opt}>
                      <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition">
                        <input
                          type="checkbox"
                          value={opt}
                          checked={usabilityImpact.includes(opt)}
                          onChange={() => handleImpactChange(opt)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <span>{opt}</span>
                      </label>
                      {opt === otherOptionLabel &&
                        usabilityImpact.includes(otherOptionLabel) && (
                          <textarea
                            value={usabilityImpactOther}
                            onChange={(e) =>
                              setUsabilityImpactOther(e.target.value)
                            }
                            placeholder={
                              lang === "ja"
                                ? "具体的に教えてください..."
                                : "Please specify..."
                            }
                            className="w-full mt-2 p-3 border border-gray-300 rounded-lg text-sm"
                            rows={2}
                          />
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Q4: 最も使いやすかった特徴 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-3">
                  {t(lang, "postSurveyQ4")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1">
                  {featureOptions.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition"
                    >
                      <input
                        type="radio"
                        name="q4_best"
                        value={opt}
                        checked={bestFeature === opt}
                        onChange={(e) => setBestFeature(e.target.value)}
                        className="w-5 h-5 text-green-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q5: 最も使いにくかった特徴 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-3">
                  {t(lang, "postSurveyQ5")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1">
                  {featureOptions.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition"
                    >
                      <input
                        type="radio"
                        name="q5_worst"
                        value={opt}
                        checked={worstFeature === opt}
                        onChange={(e) => setWorstFeature(e.target.value)}
                        className="w-5 h-5 text-red-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q6: 改善点 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-2">
                  {t(lang, "postSurveyQ6")}
                </label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder={
                    lang === "ja"
                      ? "自由にご記入ください..."
                      : "Feel free to write..."
                  }
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={4}
                />
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="mt-4 text-center pb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="px-16 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-black text-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                {t(lang, "postSurveySubmit")} 📥
              </motion.button>
              <p className="mt-4 text-sm text-gray-500">
                {t(lang, "postSurveyNote")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}