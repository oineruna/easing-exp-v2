import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface TaskEndOverlayProps {
  isVisible: boolean;
  lang: Lang;
  isLastTask: boolean;
  onContinue: (survey: {
    animationEaseRating: string;
    taskDifficultyRating: string;
    animationDifferenceRating: string;
    comments: string;
  }) => void;
}

export function TaskEndOverlay({ isVisible, lang, isLastTask, onContinue }: TaskEndOverlayProps) {
  const [animationEaseRating, setAnimationEaseRating] = useState('');
  const [taskDifficultyRating, setTaskDifficultyRating] = useState('');
  const [animationDifferenceRating, setAnimationDifferenceRating] = useState('');
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    if (!animationEaseRating || !taskDifficultyRating || !animationDifferenceRating) {
      alert(t(lang, 'surveyAlert'));
      return;
    }

    onContinue({
      animationEaseRating,
      taskDifficultyRating,
      animationDifferenceRating,
      comments,
    });

    // Reset form
    setAnimationEaseRating('');
    setTaskDifficultyRating('');
    setAnimationDifferenceRating('');
    setComments('');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-8 max-w-4xl mx-4 my-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              {t(lang, 'surveyTitle')}
            </h2>

            <div className="space-y-6">
              <table className="w-full border-separate" style={{ borderSpacing: '0 12px' }}>
                <tbody className="bg-gray-50">
                  {/* Q1 */}
                  <tr>
                    <td className="p-3 align-middle">
                      <div className="font-bold text-left">
                        {t(lang, 'surveyQ1')}
                        <br />
                        <span className="text-sm text-gray-600 font-normal">
                          {t(lang, 'surveyScale1')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map(value => (
                          <label key={value} className="flex items-center gap-1 text-lg">
                            <input
                              type="radio"
                              name="animationEase"
                              value={value}
                              checked={animationEaseRating === String(value)}
                              onChange={(e) => setAnimationEaseRating(e.target.value)}
                              className="w-4 h-4 accent-blue-600"
                            />
                            {value}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Q2 */}
                  <tr>
                    <td className="p-3 align-middle">
                      <div className="font-bold text-left">
                        {t(lang, 'surveyQ2')}
                        <br />
                        <span className="text-sm text-gray-600 font-normal">
                          {t(lang, 'surveyScale2')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map(value => (
                          <label key={value} className="flex items-center gap-1 text-lg">
                            <input
                              type="radio"
                              name="taskDifficulty"
                              value={value}
                              checked={taskDifficultyRating === String(value)}
                              onChange={(e) => setTaskDifficultyRating(e.target.value)}
                              className="w-4 h-4 accent-blue-600"
                            />
                            {value}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Q3 */}
                  <tr>
                    <td className="p-3 align-middle">
                      <div className="font-bold text-left">
                        {t(lang, 'surveyQ3')}
                        <br />
                        <span className="text-sm text-gray-600 font-normal">
                          {t(lang, 'surveyScale3')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map(value => (
                          <label key={value} className="flex items-center gap-1 text-lg">
                            <input
                              type="radio"
                              name="animationDifference"
                              value={value}
                              checked={animationDifferenceRating === String(value)}
                              onChange={(e) => setAnimationDifferenceRating(e.target.value)}
                              className="w-4 h-4 accent-blue-600"
                            />
                            {value}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Comments */}
                  <tr>
                    <td className="p-3 align-middle font-bold text-left">
                      {t(lang, 'surveyComments')}
                    </td>
                    <td className="p-3 align-middle">
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded text-base resize-vertical"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-600 transition-all"
              >
                {isLastTask ? t(lang, 'toResult') : t(lang, 'continue')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
