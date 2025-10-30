import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';

interface TaskEndOverlayProps {
  isVisible: boolean;
  lang: Lang;
  isLastTask: boolean;
  onContinue: (survey: { animationEaseRating: string; taskDifficultyRating: string; animationDifferenceRating: string; comments: string }) => void;
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
    onContinue({ animationEaseRating, taskDifficultyRating, animationDifferenceRating, comments });
    setAnimationEaseRating('');
    setTaskDifficultyRating('');
    setAnimationDifferenceRating('');
    setComments('');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 overlay-bg flex items-center justify-center z-50 overflow-y-auto p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="glass-effect rounded-3xl p-8 max-w-4xl w-full shadow-2xl my-8">
            <h2 className="text-3xl font-black mb-8 text-center gradient-text">📋 {t(lang, 'surveyTitle')}</h2>
            <div className="space-y-6">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/60 rounded-2xl p-6 shadow-lg">
                <div className="font-bold text-gray-800 mb-3">{t(lang, 'surveyQ1')}<div className="text-sm text-gray-600 font-normal mt-1">{t(lang, 'surveyScale1')}</div></div>
                <div className="flex gap-4 justify-center">
                  {[1, 2, 3, 4, 5].map(value => (
                    <motion.label key={value} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`flex items-center justify-center w-14 h-14 rounded-xl cursor-pointer font-bold text-xl transition-all duration-200 ${animationEaseRating === String(value) ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110' : 'bg-white/80 text-gray-700 hover:bg-purple-100'}`}>
                      <input type="radio" name="animationEase" value={value} checked={animationEaseRating === String(value)} onChange={(e) => setAnimationEaseRating(e.target.value)} className="hidden" />{value}
                    </motion.label>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/60 rounded-2xl p-6 shadow-lg">
                <div className="font-bold text-gray-800 mb-3">{t(lang, 'surveyQ2')}<div className="text-sm text-gray-600 font-normal mt-1">{t(lang, 'surveyScale2')}</div></div>
                <div className="flex gap-4 justify-center">
                  {[1, 2, 3, 4, 5].map(value => (
                    <motion.label key={value} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`flex items-center justify-center w-14 h-14 rounded-xl cursor-pointer font-bold text-xl transition-all duration-200 ${taskDifficultyRating === String(value) ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110' : 'bg-white/80 text-gray-700 hover:bg-purple-100'}`}>
                      <input type="radio" name="taskDifficulty" value={value} checked={taskDifficultyRating === String(value)} onChange={(e) => setTaskDifficultyRating(e.target.value)} className="hidden" />{value}
                    </motion.label>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/60 rounded-2xl p-6 shadow-lg">
                <div className="font-bold text-gray-800 mb-3">{t(lang, 'surveyQ3')}<div className="text-sm text-gray-600 font-normal mt-1">{t(lang, 'surveyScale3')}</div></div>
                <div className="flex gap-4 justify-center">
                  {[1, 2, 3, 4, 5].map(value => (
                    <motion.label key={value} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`flex items-center justify-center w-14 h-14 rounded-xl cursor-pointer font-bold text-xl transition-all duration-200 ${animationDifferenceRating === String(value) ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110' : 'bg-white/80 text-gray-700 hover:bg-purple-100'}`}>
                      <input type="radio" name="animationDifference" value={value} checked={animationDifferenceRating === String(value)} onChange={(e) => setAnimationDifferenceRating(e.target.value)} className="hidden" />{value}
                    </motion.label>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/60 rounded-2xl p-6 shadow-lg">
                <div className="font-bold text-gray-800 mb-3">{t(lang, 'surveyComments')}</div>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={4} placeholder={lang === 'ja' ? '自由にご記入ください...' : 'Feel free to write...'} className="w-full p-4 border-2 border-gray-200 rounded-xl text-base resize-vertical focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/80" />
              </motion.div>
            </div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSubmit} className="px-12 py-4 btn-primary text-white rounded-2xl font-bold text-xl shadow-xl">
                {isLastTask ? `${t(lang, 'toResult')} 🎊` : `${t(lang, 'continue')} ➜`}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
