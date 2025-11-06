import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
// import { t } from '../utils/i18n';
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
    const smoothEasings: EasingFunction[] = ['easeInOutQuad', 'easeInOutQuint'];
    const snappyEasings: EasingFunction[] = ['easeInOutExpo', 'linear'];
    
    const smoothScore = smoothEasings.reduce((sum, e) => sum + (preferences[e] || 0), 0);
    const snappyScore = snappyEasings.reduce((sum, e) => sum + (preferences[e] || 0), 0);
    
    let preferenceType: 'smooth' | 'snappy' | 'other';
    if (smoothScore > snappyScore + 1) { // 差の閾値を調整
      preferenceType = 'smooth';
    } else if (snappyScore > smoothScore + 1) { // 差の閾値を調整
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
            // --- 変更点: 全体のサイズとパディングを縮小 ---
            className="glass-effect rounded-3xl p-6 max-w-3xl w-full shadow-2xl my-4" 
          >
            {/* イントロ */}
            {currentStep === 'intro' && (
              <div>
                {/* --- 変更点: フォントサイズとマージンを縮小 --- */}
                <h2 className="text-2xl font-black mb-4 text-center gradient-text">
                  📊 {lang === 'ja' ? '事前アンケート' : 'Pre-Survey'}
                </h2>
                <div className="bg-white/60 rounded-2xl p-4 mb-5 text-gray-800">
                  {/* --- 変更点: フォントサイズとマージンを縮小 --- */}
                  <p className="text-base mb-2">
                    {lang === 'ja' 
                      ? 'これから5種類のアニメーションをお見せします。各アニメーションを見て、あなたの好みを評価してください。'
                      : 'We will show you 5 types of animations. Please rate each animation based on your preference.'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {lang === 'ja'
                      ? '※ この情報は実験データの分析に使用されます'
                      : '※ This information will be used for data analysis'
                    }
                  </p>
                </div>
                <div className="text-center">
                  {/* --- 変更点: ボタンのサイズとフォントサイズを縮小 --- */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep('demo')}
                    className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg"
                  >
                    {lang === 'ja' ? '開始する' : 'Start'} →
                  </motion.button>
                </div>
              </div>
            )}


            {/* デモと評価 */}
            {currentStep === 'demo' && (
              <div>
                 {/* --- 変更点: フォントサイズとマージンを縮小 --- */}
                <h2 className="text-2xl font-black mb-6 text-center gradient-text">
                  {lang === 'ja' ? 'あなたの好みをもとにアニメーションを評価してください' : 'Rate Each Animation based on your preference'}
                </h2>
                
                {/* --- 変更点: 要素間のスペースを縮小 --- */}
                <div className="space-y-4 mb-6">
                  {EASING_DEMOS.map((demo, index) => (
                    <motion.div
                      key={demo.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      // --- 変更点: パディングを縮小 ---
                      className="bg-white/80 rounded-2xl p-4 shadow-md" 
                    >
                      <div className="flex items-center gap-4">
                        {/* アニメーションデモ */}
                        {/* --- 変更点: デモエリアとボールのサイズ、移動距離を縮小 --- */}
                        <div className="flex-shrink-0 w-48 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg relative overflow-hidden">
                          <motion.div
                            animate={{ x: [0, 152, 0] }} // w-48 (192px) - w-10 (40px) = 152px
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: demo.bezier as any,
                              repeatDelay: 0.5
                            }}
                            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-md shadow-md"
                          />
                        </div>


                        {/* 説明 */}
                        <div className="flex-1">
                          {/* --- 変更点: フォントサイズを縮小 --- */}
                          <h3 className="text-lg font-bold text-gray-800">
                            {demo.label[lang]}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {demo.description[lang]}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <div className="text-xs text-gray-600 mb-1 text-center">
                            {lang === 'ja' ? '好み度' : 'Preference'}
                          </div>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map(value => (
                               // --- 変更点: ボタンサイズを縮小 ---
                              <motion.button
                                key={value}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRatingChange(demo.name, value)}
                                className={`
                                  w-10 h-10 rounded-md font-bold text-base transition-all
                                  ${preferences[demo.name] === value
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md scale-110'
                                    : 'bg-white text-gray-700 hover:bg-purple-100'
                                  }
                                `}
                              >
                                {value}
                              </motion.button>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                            <span>{lang === 'ja' ? '低' : 'Low'}</span>
                            <span>{lang === 'ja' ? '高' : 'High'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>


                <div className="text-center">
                  {/* --- 変更点: ボタンのサイズとフォントサイズを縮小 --- */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextFromDemo}
                    className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg"
                  >
                    {lang === 'ja' ? '次へ' : 'Next'} →
                  </motion.button>
                </div>
              </div>
            )}


            {/* ランキング */}
            {currentStep === 'ranking' && (
              <div>
                {/* --- 変更点: フォントサイズとマージンを縮小 --- */}
                <h2 className="text-2xl font-black mb-4 text-center gradient-text">
                  {lang === 'ja' ? '好みの順に並べ替えてください' : 'Rank by Preference'}
                </h2>
                
                {/* --- 変更点: パディングとマージンを縮小 --- */}
                <div className="bg-white/60 rounded-2xl p-4 mb-5">
                  <p className="text-center text-sm text-gray-700 mb-3">
                    {lang === 'ja' 
                      ? 'ドラッグ＆ドロップで順位を変更できます（1位が最も好き）'
                      : 'Drag & drop to reorder (1st = most preferred)'
                    }
                  </p>
                  
                  {/* --- 変更点: 要素間のスペースを縮小 --- */}
                  <div className="space-y-2">
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
                          // --- 変更点: パディングを縮小 ---
                          className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm cursor-move"
                        >
                          {/* --- 変更点: 順位表示のサイズとフォントを縮小 --- */}
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-md flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-base text-gray-800">{demo.label[lang]}</div>
                            <div className="text-xs text-gray-600">{demo.description[lang]}</div>
                          </div>
                          {/* --- 変更点: フォントサイズを縮小 --- */}
                          <div className="text-xl text-gray-400">⋮⋮</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>


                <div className="text-center">
                   {/* --- 変更点: ボタンのサイズとフォントサイズを縮小 --- */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep('comments')}
                    className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg"
                  >
                    {lang === 'ja' ? '次へ' : 'Next'} →
                  </motion.button>
                </div>
              </div>
            )}


            {/* コメント */}
            {currentStep === 'comments' && (
              <div>
                {/* --- 変更点: フォントサイズとマージンを縮小 --- */}
                <h2 className="text-2xl font-black mb-4 text-center gradient-text">
                  {lang === 'ja' ? '最後に一言（任意）' : 'Additional Comments (Optional)'}
                </h2>
                
                {/* --- 変更点: パディングとマージンを縮小 --- */}
                <div className="bg-white/60 rounded-2xl p-4 mb-5">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    // --- 変更点: textareaの高さを縮小 ---
                    rows={4}
                    placeholder={lang === 'ja' 
                      ? 'アニメーションの好みについて、何か気づいたことがあれば自由にお書きください...'
                      : 'Feel free to share any thoughts about your animation preferences...'
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm resize-vertical focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/80"
                  />
                </div>

                <div className="text-center">
                  {/* --- 変更点: ボタンのサイズとフォントサイズを縮小 --- */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    className="px-10 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg"
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
