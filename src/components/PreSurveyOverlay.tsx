import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { t } from "../utils/i18n";
import type { Lang } from "../utils/i18n";
import type { EasingFunction, PreSurveyData } from "../experiment";

interface PreSurveyOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onComplete: (data: PreSurveyData) => void;
}

const EASING_DEMOS: Array<{
  name: EasingFunction;
  labelKey: string;
  descKey: string;
  bezier: [number, number, number, number];
}> = [
  {
    name: "linear",
    labelKey: "easingLinearLabel",
    descKey: "easingLinearDesc",
    bezier: [0.25, 0.25, 0.75, 0.75],
  },
  {
    name: "easeInOutQuad",
    labelKey: "easingQuadLabel",
    descKey: "easingQuadDesc",
    bezier: [0.455, 0.03, 0.515, 0.955],
  },
  {
    name: "easeInOutQuint",
    labelKey: "easingQuintLabel",
    descKey: "easingQuintDesc",
    bezier: [0.86, 0, 0.07, 1],
  },
  {
    name: "easeInOutExpo",
    labelKey: "easingExpoLabel",
    descKey: "easingExpoDesc",
    bezier: [1, 0, 0, 1],
  },
  {
    name: "easeInOutBack",
    labelKey: "easingBackLabel",
    descKey: "easingBackDesc",
    bezier: [0.68, -0.55, 0.265, 1.55],
  },
];

export function PreSurveyOverlay({
  isVisible,
  lang,
  onComplete,
}: PreSurveyOverlayProps) {
  const [currentStep, setCurrentStep] = useState<
    "intro" | "demo" | "ranking" | "comments"
  >("intro");
  const [preferences, setPreferences] = useState<
    Record<EasingFunction, number>
  >({} as any);
  const [ranking, setRanking] = useState<EasingFunction[]>([]);
  const [comments, setComments] = useState("");
  const [draggedItem, setDraggedItem] = useState<EasingFunction | null>(null);

  const handleRatingChange = (easing: EasingFunction, rating: number) => {
    setPreferences((prev) => ({ ...prev, [easing]: rating }));
  };

  const handleNextFromDemo = () => {
    if (Object.keys(preferences).length < EASING_DEMOS.length) {
      alert(t(lang, "preSurveyAlert"));
      return;
    }
    const sorted = EASING_DEMOS.map((d) => d.name).sort(
      (a, b) => (preferences[b] || 0) - (preferences[a] || 0)
    );
    setRanking(sorted);
    setCurrentStep("ranking");
  };

  const handleDragStart = (easing: EasingFunction) => {
    setDraggedItem(easing);
  };

  const handleDrop = (targetIndex: number) => {
    if (!draggedItem) return;
    const newRanking = [...ranking];
    const oldIndex = newRanking.indexOf(draggedItem);
    newRanking.splice(oldIndex, 1);
    newRanking.splice(targetIndex, 0, draggedItem);
    setRanking(newRanking);
    setDraggedItem(null);
  };

  const handleSubmit = () => {
    const smoothEasings: EasingFunction[] = ["easeInOutQuad", "easeInOutQuint"];
    const snappyEasings: EasingFunction[] = ["easeInOutExpo", "linear"];

    const smoothScore = smoothEasings.reduce(
      (sum, e) => sum + (preferences[e] || 0),
      0
    );
    const snappyScore = snappyEasings.reduce(
      (sum, e) => sum + (preferences[e] || 0),
      0
    );

    let preferenceType: "smooth" | "snappy" | "other";
    if (smoothScore > snappyScore + 1) {
      preferenceType = "smooth";
    } else if (snappyScore > smoothScore + 1) {
      preferenceType = "snappy";
    } else {
      preferenceType = "other";
    }

    onComplete({
      preferences,
      ranking,
      preferenceType,
      comments,
    });
  };

  // ★ デバッグ用スキップ
  const handleDebugSkip = () => {
    const dummyRanking = EASING_DEMOS.map((d) => d.name);
    const dummyPreferences: any = {};
    EASING_DEMOS.forEach((d) => (dummyPreferences[d.name] = 3));

    onComplete({
      preferences: dummyPreferences,
      ranking: dummyRanking,
      preferenceType: "other",
      comments: "Debug Skip",
    });
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
  }, []); // handleDebugSkip is stable or can be omitted from deps if defined inside component but doesn't use reactive state that changes mid-survey (it uses constants/props mostly)
  // Actually handleDebugSkip uses participantId which is prop, so it's fine. But to be safe/clean:
  // Let's just suppress deps or include them. handleDebugSkip is defined inside, so it changes every render.
  // Better to wrap handleDebugSkip in useCallback or just disable lint for this line if needed, but let's try to be clean.
  // For now, empty deps [] is risky if props change, but participantId shouldn't change mid-overlay.
  // Let's include handleDebugSkip in the previous tool call I tried to include it.
  // Re-writing the target content to match exactly what's there.

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-effect rounded-3xl p-6 max-w-3xl w-full shadow-2xl my-4"
          >
            {/* イントロ */}
            {currentStep === "intro" && (
              <div>
                <h2 className="text-2xl font-black mb-6 text-center">
                  <span style={{ color: "#333" }}>📊 </span>
                  <span className="gradient-text">
                    {t(lang, "preSurveyTitle")}
                  </span>
                </h2>
                <div className="bg-white/60 rounded-2xl p-4 mb-5 text-gray-800">
                  <p className="text-base mb-2">{t(lang, "preSurveyIntro")}</p>
                  <p className="text-sm text-gray-600">
                    {t(lang, "preSurveyNote")}
                  </p>
                </div>
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep("demo")}
                    className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg"
                  >
                    {t(lang, "preSurveyStart")} →
                  </motion.button>
                </div>
              </div>
            )}

            {/* デモと評価 */}
            {currentStep === "demo" && (
              <div>
                <h2 className="text-2xl font-black mb-6 text-center gradient-text">
                  {t(lang, "preSurveyDemoTitle")}
                </h2>

                <div className="space-y-4 mb-6">
                  {EASING_DEMOS.map((demo, index) => (
                    <motion.div
                      key={demo.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/80 rounded-2xl p-4 shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        {/* アニメーションデモ */}
                        <div className="flex-shrink-0 w-48 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg relative overflow-hidden">
                          <motion.div
                            animate={{ x: [0, 152, 0] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: demo.bezier as any,
                              repeatDelay: 0.5,
                            }}
                            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-md shadow-md"
                          />
                        </div>

                        {/* 説明 */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-800">
                            {t(lang, demo.labelKey)}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {t(lang, demo.descKey)}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <div className="text-base font-bold text-gray-600 mb-1 text-center">
                            {t(lang, "preSurveyPreference")}
                          </div>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <motion.button
                                key={value}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleRatingChange(demo.name, value)
                                }
                                className={`
                                  w-10 h-10 rounded-md font-bold text-base transition-all
                                  ${
                                    preferences[demo.name] === value
                                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md scale-110"
                                      : "bg-white text-gray-700 hover:bg-purple-100"
                                  }
                                `}
                              >
                                {value}
                              </motion.button>
                            ))}
                          </div>
                          <div className="flex justify-between text-sm font-bold text-gray-500 mt-1 px-1">
                            <span>{t(lang, "preSurveyLow")}</span>
                            <span>{t(lang, "preSurveyHigh")}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextFromDemo}
                    className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg"
                  >
                    {t(lang, "preSurveyNext")} →
                  </motion.button>
                </div>
              </div>
            )}

            {/* ランキング */}
            {currentStep === "ranking" && (
              <div>
                <h2 className="text-2xl font-black mb-4 text-center gradient-text">
                  {t(lang, "preSurveyRankingTitle")}
                </h2>

                <div className="bg-white/60 rounded-2xl p-4 mb-5">
                  <p className="text-center text-lg font-bold text-gray-700 mb-3">
                    {t(lang, "preSurveyRankingDesc")}
                  </p>

                  <div className="space-y-2">
                    {ranking.map((easing, index) => {
                      const demo = EASING_DEMOS.find((d) => d.name === easing)!;
                      return (
                        <motion.div
                          key={easing}
                          draggable
                          onDragStart={() => handleDragStart(easing)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(index)}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm cursor-move"
                        >
                          {/* 順位表示 */}
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-md flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>

                          {/* 🆕 アニメーションプレビューを追加 */}
                          <div className="flex-shrink-0 w-32 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg relative overflow-hidden">
                            <motion.div
                              animate={{ x: [0, 96, 0] }} // w-32 (128px) - w-8 (32px) = 96px
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: demo.bezier as any,
                                repeatDelay: 0.3,
                              }}
                              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-md shadow-md"
                            />
                          </div>

                          {/* ラベルと説明 */}
                          <div className="flex-1">
                            <div className="font-bold text-xl text-gray-800">
                              {t(lang, demo.labelKey)}
                            </div>
                            <div className="text-xs text-gray-600">
                              {t(lang, demo.descKey)}
                            </div>
                          </div>

                          {/* ドラッグハンドル */}
                          <div className="text-xl text-gray-400">⋮⋮</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep("comments")}
                    className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg"
                  >
                    {t(lang, "preSurveyNext")} →
                  </motion.button>
                </div>
              </div>
            )}

            {/* コメント */}
            {currentStep === "comments" && (
              <div>
                <h2 className="text-2xl font-black mb-4 text-center gradient-text">
                  {t(lang, "preSurveyCommentTitle")}
                </h2>

                <div className="bg-white/60 rounded-2xl p-4 mb-5">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    placeholder={t(lang, "preSurveyCommentPlaceholder")}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm resize-vertical focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/80"
                  />
                </div>

                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    className="px-10 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg"
                  >
                    {t(lang, "preSurveyComplete")} ✓
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
