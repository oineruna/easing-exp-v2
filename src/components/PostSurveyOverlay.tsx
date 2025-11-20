// --- START OF FILE src/components/PostSurveyOverlay.tsx ---

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
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
  const [worstFeature, setWorstFeature] = useState<string>(""); // ★ 追加
  const [inputDevice, setInputDevice] = useState<string>(""); // ★ 追加
  const [improvements, setImprovements] = useState<string>("");

  const impactOptions = [
    "操作のスピードが上がった（速く終わるようになった）",
    "操作のスピードが下がった（遅くなった）",
    "どこを操作すればいいか分かりやすくなった",
    "どこを操作すればいいか分かりにくくなった",
    "ストレスが減った",
    "ストレスが増えた",
    "特に変化は感じなかった",
    "その他",
  ];

  const featureOptions = [
    "ゆっくり滑らかに動く",
    "素早く動く",
    "弾むような動き",
    "一定速度で動く",
  ];

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
      !worstFeature || // ★ 追加
      !inputDevice // ★ 追加
    ) {
      alert("すべての必須項目に回答してください。");
      return;
    }

    const result: PostSurveyResult = {
      participantId,
      noticeDifference,
      usabilityImpact,
      usabilityImpactOther,
      bestFeature,
      worstFeature, // ★ 追加
      inputDevice, // ★ 追加
      improvements,
    };

    onComplete(result);
  };

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
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <h2 className="text-3xl font-black mb-8 text-center text-gray-800 border-b pb-4 sticky top-0 bg-white z-10">
              📋 事後アンケート
            </h2>

            <div className="space-y-8 text-left pb-4">
              {/* Q1: ID */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-2">
                  1. 被験者ID
                </label>
                <input
                  type="text"
                  value={participantId}
                  readOnly
                  className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg text-gray-600 font-mono cursor-not-allowed"
                />
              </div>

              {/* Q2: 違いに気づいたか */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-3">
                  2.
                  実験全体を通して、メニューアニメーションに違いがあることに気づきましたか？{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {["はい", "いいえ", "よくわからなかった"].map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition"
                    >
                      <input
                        type="radio"
                        name="q3_notice"
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
                  3.
                  アニメーションがタスクのやりやすさに与えた影響について、当てはまるものをすべて選んでください。{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
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
                      {opt === "その他" &&
                        usabilityImpact.includes("その他") && (
                          <textarea
                            value={usabilityImpactOther}
                            onChange={(e) =>
                              setUsabilityImpactOther(e.target.value)
                            }
                            placeholder="具体的に教えてください..."
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
                  4. 最も「使いやすい」と感じたアニメーションの特徴は何ですか？{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {featureOptions.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-green-50 transition"
                    >
                      <input
                        type="radio"
                        name="q5_best"
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

              {/* Q5: 最も使いにくかった特徴 (★追加) */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="block font-bold text-gray-800 mb-3">
                  5.
                  最も「使いにくい・操作しづらい」と感じたアニメーションの特徴は何ですか？{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {featureOptions.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-red-50 transition"
                    >
                      <input
                        type="radio"
                        name="q6_worst"
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
                  6.
                  アニメーションや操作性について、改善してほしい点や気になったことがあれば教えてください
                </label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="自由にご記入ください..."
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
                回答を送信してデータを保存 📥
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
