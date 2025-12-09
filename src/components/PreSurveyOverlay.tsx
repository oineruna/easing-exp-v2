import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { t } from "../utils/i18n";
import type { Lang, TextKey } from "../utils/i18n";
import type { EasingFunction, PreSurveyData } from "../experiment";

interface PreSurveyOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onComplete: (data: PreSurveyData) => void;
}

// イージング関数のデモ用データ定義
// 各イージングの名称、翻訳キー、ベジェ曲線のパラメータを保持
const EASING_DEMOS: Array<{
  name: EasingFunction;
  labelKey: TextKey;
  descKey: TextKey;
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

/**
 * 実験前のアンケートオーバーレイ
 * 参加者のイージングに対する好みや属性を収集します
 * ステップバイステップ形式（イントロ -> デモ評価 -> ランキング -> コメント）で進行します
 */
export function PreSurveyOverlay({
  isVisible,
  lang,
  onComplete,
}: PreSurveyOverlayProps) {
  // 現在のステップ管理
  const [currentStep, setCurrentStep] = useState<
    "intro" | "demo" | "ranking"
  >("intro");

  // 各イージングへの評価値 (1-5)
  const [preferences, setPreferences] = useState<
    Record<EasingFunction, number>
  >({} as any);

  // 好みの順位付けリスト
  const [ranking, setRanking] = useState<EasingFunction[]>([]);

  // 自由記述コメント（削除済み - 空文字列で保持）
  const comments = "";

  // ドラッグ＆ドロップ用の状態
  const [draggedItem, setDraggedItem] = useState<EasingFunction | null>(null);

  /**
   * 評価値が変更されたときの処理
   */
  const handleRatingChange = (easing: EasingFunction, rating: number) => {
    setPreferences((prev) => ({ ...prev, [easing]: rating }));
  };

  /**
   * デモ評価画面からランキング画面へ進む処理
   * 全てのイージングが評価されているか確認し、初期ランキングを生成します
   */
  const handleNextFromDemo = () => {
    if (Object.keys(preferences).length < EASING_DEMOS.length) {
      alert(t(lang, "preSurveyAlert"));
      return;
    }
    // 評価値が高い順にソートして初期ランキングを作成
    const sorted = EASING_DEMOS.map((d) => d.name).sort(
      (a, b) => (preferences[b] || 0) - (preferences[a] || 0)
    );
    setRanking(sorted);
    setCurrentStep("ranking");
  };

  // --- ドラッグ＆ドロップ処理 ---
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

  /**
   * アンケート完了時の処理
   * 収集したデータを集計・分析して親コンポーネントへ渡します
   */
  const handleSubmit = () => {
    const smoothEasings: EasingFunction[] = ["easeInOutQuad", "easeInOutQuint"];
    const snappyEasings: EasingFunction[] = ["easeInOutExpo", "linear"];

    // 好みの傾向を簡易分析
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

  // ★ デバッグ用スキップ機能
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

  // Shift + Enter でスキップ可能にするイベントリスナー
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-effect rounded-3xl p-6 max-w-3xl w-full shadow-2xl my-4"
          >
            {/* ステップ1: イントロダクション */}
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

            {/* ステップ2: デモアニメーションと評価 */}
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
                        {/* アニメーションプレビュー */}
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

                        {/* 説明テキスト */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-800">
                            {t(lang, demo.labelKey)}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {t(lang, demo.descKey)}
                          </p>
                        </div>

                        {/* 評価ボタン (1-5) */}
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
                                  w-10 h-10 rounded-lg font-bold text-base transition-all flex items-center justify-center
                                  ${preferences[demo.name] === value
                                    ? "bg-gradient-to-b from-purple-500 to-pink-500 text-white shadow-md scale-105 border-0"
                                    : "bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-300"
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

            {/* ステップ3: ランキング並べ替え */}
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
                          {/* 順位バッジ */}
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-md flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>

                          {/* アニメーションプレビュー（小） */}
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

                          {/* ラベル */}
                          <div className="flex-1">
                            <div className="font-bold text-xl text-gray-800">
                              {t(lang, demo.labelKey)}
                            </div>
                            <div className="text-xs text-gray-600">
                              {t(lang, demo.descKey)}
                            </div>
                          </div>

                          {/* ドラッグハンドルアイコン */}
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
