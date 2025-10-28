import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';
import type { EasingFunction } from '../types/experiment';

interface PreSurveyOverlayProps {
  isVisible: boolean;
  lang: Lang;
  onComplete: (data: PreSurveyData) => void;
}

export interface PreSurveyData {
  preferences: Record<EasingFunction, number>; // 1-5の評価
  ranking: EasingFunction[]; // 好みの順位
  preferenceType: 'smooth' | 'snappy' | 'other'; // 自動分類
  comments: string;
}

const EASING_DEMOS: Array<{
  name: EasingFunction;
  label: { ja: string; en: string };
  description: { ja: string; en: string };
  bezier: [number, number, number, number];
}> = [
  {
    name: 'linear',
    label: { ja: '一定速度', en: 'Linear' },
    description: { ja: '等速で動く', en: 'Constant speed' },
    bezier: [0.25, 0.25, 0.75, 0.75]
  },
  {
    name: 'easeInOutQuad',
    label: { ja: '滑らか（弱）', en: 'Smooth (Weak)' },
    description: { ja: 'ゆっくり加速・減速', en: 'Gentle acceleration' },
    bezier: [0.455, 0.03, 0.515, 0.955]
  },
  {
    name: 'easeInOutQuint',
    label: { ja: '滑らか（強）', en: 'Smooth (Strong)' },
    description: { ja: 'とても滑らか', en: 'Very smooth' },
    bezier: [0.86, 0, 0.07, 1]
  },
  {
    name: 'easeInOutExpo',
    label: { ja: 'キビキビ', en: 'Snappy' },
    description: { ja: '急加速・急停止', en: 'Quick start/stop' },
    bezier: [1, 0, 0, 1]
  },
  {
    name: 'easeInOutBack',
    label: { ja: 'バウンス', en: 'Bounce' },
    description: { ja: 'オーバーシュート', en: 'Overshoot effect' },
    bezier: [0.68, -0.55, 0.265, 1.55]
  }
];

export function PreSurveyOverlay({ isVisible, lang, onComplete }: PreSurveyOverlayProps) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'demo' | 'ranking' | 'comments'>('intro');
  const [preferences, setPreferences] = useState<Record<EasingFunction, number>>({} as any);
  const [ranking, setRanking] = useState<EasingFunction[]>([]);
  const [comments, setComments] = useState('');
  const [draggedItem, setDraggedItem] = useState<EasingFunction | null>(null);

  const handleRatingChange = (easing: EasingFunction, rating: number) => {
    setPreferences(prev => ({ ...prev, [easing]: rating }));
  };

  const handleNextFromDemo = () => {
    if (Object.keys(preferences).length < EASING_DEMOS.length) {
      alert(lang === 'ja' ? 'すべてのアニメーションを評価してください' : 'Please rate all animations');
      return;
    }
    // 評価から仮の順位を作成
    const sorted = EASING_DEMOS
      .map(d => d.name)
      .sort((a, b) => (preferences[b] || 0) - (preferences[a] || 0));
    setRanking(sorted);
    setCurrentStep('ranking');
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
    // 好みタイプを自動分類
    const smoothEasings: EasingFunction[] = ['easeInOutQuad', 'easeInOutQuint'];
    const snappyEasings: EasingFunction[] = ['easeInOutExpo', 'linear'];
    
    const smoothScore = smoothEasings.reduce((sum, e) => sum + (preferences[e] || 0), 0);
    const snappyScore = snappyEasings.reduce((sum, e) => sum + (preferences[e] || 0), 0);
    
    let preferenceType: 'smooth' | 'snappy' | 'other';
    if (smoothScore > snappyScore + 2) {
      preferenceType = 'smooth';
    } else if (snappyScore > smoothScore + 2) {
      preferenceType = 'snappy';
    } else {
      preferenceType = 'other';
    }

    onComplete({
      preferences,
      ranking,
      preferenceType,
      comments
    });
  };

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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-effect rounded-3xl p-8 max-w-5xl w-full shadow-2xl my-8"
          >
            {/* イントロ */}
            {currentStep === 'intro' && (
              <div>
                <h2 className="text-3xl font-black mb-6 text-center gradient-text">
                  📊 {lang === 'ja' ? '事前アンケート' : 'Pre-Survey'}
                </h2>
                <div className="bg-white/60 rounded-2xl p-6 mb-6 text-gray-800">
                  <p className="text-lg mb-4">
                    {lang === 'ja' 
                      ? 'これから5種類のアニメーションをお見せします。各アニメーションを見て、あなたの好みを評価してください。'
                      : 'We will show you 5 types of animations. Please rate each animation based on your preference.'
                    }
                  </p>
                  <p className="text-base text-gray-600">
                    {lang === 'ja'
                      ? '※ この情報は実験データの分析に使用されます'
                      : '※ This information will be used for data analysis'
                    }
                  </p>
                </div>
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep('demo')}
                    className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-xl shadow-xl"
                  >
                    {lang === 'ja' ? '開始する' : 'Start'} →
                  </motion.button>
                </div>
              </div>
            )}

            {/* デモと評価 */}
            {currentStep === 'demo' && (
              <div>
                <h2 className="text-3xl font-black mb-8 text-center gradient-text">
                  {lang === 'ja' ? 'アニメーションを評価してください' : 'Rate Each Animation'}
                </h2>
                
                <div className="space-y-6 mb-8">
                  {EASING_DEMOS.map((demo, index) => (
                    <motion.div
                      key={demo.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/80 rounded-2xl p-6 shadow-lg"
                    >
                      <div className="flex items-center gap-6">
                        {/* アニメーションデモ */}
                        <div className="flex-shrink-0 w-64 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl relative overflow-hidden">
                          <motion.div
                            animate={{ x: [0, 200, 0] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: demo.bezier as any,
                              repeatDelay: 0.5
                            }}
                            className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg"
                          />
                        </div>

                        {/* 説明 */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">
                            {demo.label[lang]}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {demo.description[lang]}
                          </p>
                        </div>

                        {/* 評価 */}
                        <div className="flex-shrink-0">
                          <div className="text-sm text-gray-600 mb-2 text-center">
                            {lang === 'ja' ? '好み度' : 'Preference'}
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(value => (
                              <motion.button
                                key={value}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRatingChange(demo.name, value)}
                                className={`
                                  w-12 h-12 rounded-lg font-bold text-lg transition-all
                                  ${preferences[demo.name] === value
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                                    : 'bg-white text-gray-700 hover:bg-purple-100'
                                  }
                                `}
                              >
                                {value}
                              </motion.button>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{lang === 'ja' ? '低' : 'Low'}</span>
                            <span>{lang === 'ja' ? '高' : 'High'}</span>
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
                    className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-xl shadow-xl"
                  >
                    {lang === 'ja' ? '次へ' : 'Next'} →
                  </motion.button>
                </div>
              </div>
            )}

            {/* ランキング */}
            {currentStep === 'ranking' && (
              <div>
                <h2 className="text-3xl font-black mb-6 text-center gradient-text">
                  {lang === 'ja' ? '好みの順に並べ替えてください' : 'Rank by Preference'}
                </h2>
                
                <div className="bg-white/60 rounded-2xl p-6 mb-6">
                  <p className="text-center text-gray-700 mb-4">
                    {lang === 'ja' 
                      ? 'ドラッグ＆ドロップで順位を変更できます（1位が最も好き）'
                      : 'Drag & drop to reorder (1st = most preferred)'
                    }
                  </p>
                  
                  <div className="space-y-3">
                    {ranking.map((easing, index) => {
                      const demo = EASING_DEMOS.find(d => d.name === easing)!;
                      return (
                        <motion.div
                          key={easing}
                          draggable
                          onDragStart={() => handleDragStart(easing)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(index)}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md cursor-move"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{demo.label[lang]}</div>
                            <div className="text-sm text-gray-600">{demo.description[lang]}</div>
                          </div>
                          <div className="text-2xl">⋮⋮</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep('comments')}
                    className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-xl shadow-xl"
                  >
                    {lang === 'ja' ? '次へ' : 'Next'} →
                  </motion.button>
                </div>
              </div>
            )}

            {/* コメント */}
            {currentStep === 'comments' && (
              <div>
                <h2 className="text-3xl font-black mb-6 text-center gradient-text">
                  {lang === 'ja' ? '最後に一言（任意）' : 'Additional Comments (Optional)'}
                </h2>
                
                <div className="bg-white/60 rounded-2xl p-6 mb-6">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={6}
                    placeholder={lang === 'ja' 
                      ? 'アニメーションの好みについて、何か気づいたことがあれば自由にお書きください...'
                      : 'Feel free to share any thoughts about your animation preferences...'
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl text-base resize-vertical focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/80"
                  />
                </div>

                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-xl shadow-xl"
                  >
                    {lang === 'ja' ? '完了' : 'Complete'} ✓
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