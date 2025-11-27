import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Lang, EasingFunction } from "../experiment";

// 🔧 型名を変更して衝突を回避
export interface EasingEvaluationData {
  easingFunction: EasingFunction;
  usability: number;      // 使いやすさ
  smoothness: number;     // 滑らかさ
  responsiveness: number; // 応答性
  preference: number;     // 総合的好み
}

interface EasingEvaluationProps {
  lang: Lang;
  easingFunctions: EasingFunction[];
  onSubmit: (evaluations: EasingEvaluationData[]) => void;
}

// イージング関数の表示ラベル定義
const easingLabels: Record<EasingFunction, { ja: string; en: string }> = {
  linear: { ja: "一定速度", en: "Linear" },
  easeInOutQuad: { ja: "滑らか(弱)", en: "Smooth (Weak)" },
  easeInOutQuint: { ja: "滑らか(強)", en: "Smooth (Strong)" },
  easeInOutExpo: { ja: "キビキビ", en: "Snappy" },
  easeInOutBack: { ja: "バウンス", en: "Bounce" },
};

/**
 * イージング関数の詳細評価コンポーネント
 * 各イージングについて、複数の観点から7段階評価を行います
 */
export const EasingEvaluation: React.FC<EasingEvaluationProps> = ({
  lang,
  easingFunctions,
  onSubmit,
}) => {
  // 評価データの状態管理
  const [evaluations, setEvaluations] = useState<
    Record<string, Partial<EasingEvaluationData>>
  >({});

  // 言語リソース
  const labels = {
    ja: {
      title: "イージング関数の評価",
      instruction: "各アニメーションについて、以下の項目を評価してください",
      usability: "使いやすさ",
      smoothness: "滑らかさ",
      responsiveness: "応答性",
      preference: "総合的好み",
      low: "低い",
      high: "高い",
      submit: "完了",
      pleaseComplete: "すべての項目を評価してください",
    },
    en: {
      title: "Easing Function Evaluation",
      instruction: "Please rate each animation on the following criteria",
      usability: "Usability",
      smoothness: "Smoothness",
      responsiveness: "Responsiveness",
      preference: "Overall Preference",
      low: "Low",
      high: "High",
      submit: "Complete",
      pleaseComplete: "Please complete all ratings",
    },
  };

  const text = labels[lang];

  /**
   * 評価値更新ハンドラ
   */
  const handleRating = (
    easing: EasingFunction,
    criterion: keyof EasingEvaluationData,
    value: number
  ) => {
    setEvaluations((prev) => ({
      ...prev,
      [easing]: {
        ...prev[easing],
        easingFunction: easing,
        [criterion]: value,
      },
    }));
  };

  /**
   * 全ての項目が評価済みかチェック
   */
  const isComplete = () => {
    return easingFunctions.every((easing) => {
      const evaluation = evaluations[easing];
      return (
        evaluation?.usability &&
        evaluation?.smoothness &&
        evaluation?.responsiveness &&
        evaluation?.preference
      );
    });
  };

  /**
   * 送信処理
   */
  const handleSubmit = () => {
    if (isComplete()) {
      const completeEvaluations = easingFunctions.map((easing) => ({
        easingFunction: easing,
        usability: evaluations[easing]?.usability || 0,
        smoothness: evaluations[easing]?.smoothness || 0,
        responsiveness: evaluations[easing]?.responsiveness || 0,
        preference: evaluations[easing]?.preference || 0,
      }));
      onSubmit(completeEvaluations);
    }
  };

  // 評価項目リスト
  const criteria: Array<{ key: keyof EasingEvaluationData; label: string }> = [
    { key: "usability", label: text.usability },
    { key: "smoothness", label: text.smoothness },
    { key: "responsiveness", label: text.responsiveness },
    { key: "preference", label: text.preference },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        {text.title}
      </h2>
      <p className="text-gray-600 mb-8 text-center">{text.instruction}</p>

      <div className="space-y-8">
        {easingFunctions.map((easing) => (
          <div key={easing} className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {easingLabels[easing][lang]}
            </h3>

            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div key={String(criterion.key)}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {criterion.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {evaluations[easing]?.[criterion.key] || "-"}
                    </span>
                  </div>

                  {/* 7段階評価ボタン */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                      <motion.button
                        key={value}
                        onClick={() =>
                          handleRating(easing, criterion.key, value)
                        }
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          flex-1 h-12 rounded-lg font-bold transition-all
                          ${evaluations[easing]?.[criterion.key] === value
                            ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }
                        `}
                      >
                        {value}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-xs text-gray-500">{text.low}</span>
                    <span className="text-xs text-gray-500">{text.high}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 送信ボタン */}
      <div className="text-center mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!isComplete()}
          className={`
            px-16 py-4 rounded-xl font-bold text-lg shadow-lg
            ${isComplete()
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {text.submit} ✓
        </motion.button>

        {!isComplete() && (
          <p className="text-sm text-red-500 mt-3">{text.pleaseComplete}</p>
        )}
      </div>
    </div>
  );
};
