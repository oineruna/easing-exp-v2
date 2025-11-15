import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Lang } from "../types/experiment";

interface SEQEvaluationProps {
  lang: Lang;
  onSubmit: (score: number) => void;
}

/**
 * Single Ease Question (SEQ) コンポーネント
 * タスク完了後に即座に評価を取得
 */
export const SEQEvaluation: React.FC<SEQEvaluationProps> = ({
  lang,
  onSubmit,
}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedScore !== null) {
      onSubmit(selectedScore);
    }
  };

  const labels = {
    ja: {
      question: "このタスクはどのくらい簡単でしたか?",
      veryDifficult: "非常に難しい",
      veryEasy: "非常に簡単",
      submit: "次へ",
      pleaseSelect: "評価を選択してください",
    },
    en: {
      question: "How easy was this task?",
      veryDifficult: "Very Difficult",
      veryEasy: "Very Easy",
      submit: "Next",
      pleaseSelect: "Please select a rating",
    },
  };

  const text = labels[lang];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {text.question}
        </h2>

        {/* 7段階評価スケール */}
        <div className="mb-8">
          <div className="flex justify-between items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((score) => (
              <motion.button
                key={score}
                onClick={() => setSelectedScore(score)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex-1 h-20 rounded-xl font-bold text-xl transition-all
                  ${
                    selectedScore === score
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-110"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {score}
              </motion.button>
            ))}
          </div>

          {/* ラベル */}
          <div className="flex justify-between mt-3 px-2">
            <span className="text-sm text-gray-600">{text.veryDifficult}</span>
            <span className="text-sm text-gray-600">{text.veryEasy}</span>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={selectedScore === null}
            className={`
              px-12 py-4 rounded-xl font-bold text-lg shadow-lg
              ${
                selectedScore !== null
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {text.submit} →
          </motion.button>

          {selectedScore === null && (
            <p className="text-sm text-red-500 mt-3">{text.pleaseSelect}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
