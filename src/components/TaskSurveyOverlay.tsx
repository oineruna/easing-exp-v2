import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { t } from "../utils/i18n";
import type { Lang } from "../utils/i18n";

interface TaskSurveyOverlayProps {
  isVisible: boolean; // 表示状態
  lang: Lang;         // 言語設定
  taskNumber: number; // 現在のタスク番号（表示用）
  onComplete: (data: {
    easeRating: number;       // 操作感の評価値
    difficultyRating: number; // 難易度の評価値
    differenceRating: number; // 違和感の評価値
    comments: string;         // 自由記述コメント
  }) => void;
}

/**
 * タスクごとのアンケートオーバーレイ
 * 各試行の直後に表示され、主観評価を収集します
 */
export function TaskSurveyOverlay({
  isVisible,
  lang,
  taskNumber,
  onComplete,
}: TaskSurveyOverlayProps) {
  // アンケートの回答状態
  const [easeRating, setEaseRating] = useState<number | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [differenceRating, setDifferenceRating] = useState<number | null>(null);
  const [comments, setComments] = useState("");

  /**
   * 送信ボタン押下時の処理
   * 全項目が入力されているか確認し、親コンポーネントへデータを渡します
   */
  const handleSubmit = () => {
    // バリデーション: 全項目必須
    if (
      easeRating === null ||
      difficultyRating === null ||
      differenceRating === null
    ) {
      alert(t(lang, "surveyAlert") || "Please rate all items.");
      return;
    }

    // データ送信
    onComplete({
      easeRating,
      difficultyRating,
      differenceRating,
      comments,
    });

    // 状態リセット（次のタスク用）
    setEaseRating(null);
    setDifficultyRating(null);
    setDifferenceRating(null);
    setComments("");
  };

  // ★ デバッグ用ショートカット (Shift + Enter)
  // 開発中にアンケート入力をスキップするために使用します
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "Enter") {
        // ダミーデータで完了扱いにする
        onComplete({
          easeRating: 3,
          difficultyRating: 3,
          differenceRating: 3,
          comments: "Debug Skip",
        });
        // 状態リセット
        setEaseRating(null);
        setDifficultyRating(null);
        setDifferenceRating(null);
        setComments("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onComplete]);

  // 文言定義オブジェクト
  // 言語に応じて表示テキストを切り替えます
  const text = {
    ja: {
      title: `タスク ${taskNumber} の評価`,
      q1: "このタスクは簡単でしたか？",
      scale1: "1: 非常に難しい - 5: 非常に簡単",
      q2: "メニューの動きは操作しやすかったですか？",
      scale2: "1: 非常に使いにくい - 5: 非常に使いやすい",
      q3: "メニューの動きは自然でしたか？",
      scale3: "1: 全く不自然 - 5: とても自然",
      comment: "気になった点があれば教えてください（任意）",
      placeholder: "自由記入欄...",
      submit: "次へ進む",
    },
    en: {
      title: `Task ${taskNumber} Evaluation`,
      q1: "Was this task easy?",
      scale1: "1: Very Difficult - 5: Very Easy",
      q2: "Was the menu movement easy to operate?",
      scale2: "1: Very Hard to Use - 5: Very Easy to Use",
      q3: "Did the menu movement feel natural?",
      scale3: "1: Very Unnatural - 5: Very Natural",
      comment: "Any comments? (Optional)",
      placeholder: "Optional...",
      submit: "Next Task",
    },
  }[lang];

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
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl my-8"
          >
            {/* タイトル */}
            <h2 className="text-2xl font-black mb-6 text-center text-gray-800 border-b pb-4">
              📝 {text.title}
            </h2>

            <div className="space-y-2">
              {/* Q1: 難易度評価 */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="font-bold text-gray-800 mb-2">
                  {text.q1}
                  <span className="block text-sm text-gray-500 font-normal mt-1">
                    {text.scale1}
                  </span>
                </div>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEaseRating(value)}
                      className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${easeRating === value
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50"
                        }`}
                    >
                      {value}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Q2: 操作感評価 */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="font-bold text-gray-800 mb-2">
                  {text.q2}
                  <span className="block text-sm text-gray-500 font-normal mt-1">
                    {text.scale2}
                  </span>
                </div>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDifficultyRating(value)}
                      className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${difficultyRating === value
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50"
                        }`}
                    >
                      {value}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Q3: 違和感評価 */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="font-bold text-gray-800 mb-2">
                  {text.q3}
                  <span className="block text-sm text-gray-500 font-normal mt-1">
                    {text.scale3}
                  </span>
                </div>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDifferenceRating(value)}
                      className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${differenceRating === value
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50"
                        }`}
                    >
                      {value}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* 自由記述コメント欄 */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="font-bold text-gray-800 mb-2">
                  {text.comment}
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  placeholder={text.placeholder}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="mt-8 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all"
              >
                {text.submit} ➜
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}