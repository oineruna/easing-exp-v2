import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { ConsentOverlay } from './components/ConsentOverlay';
import { TutorialIntroOverlay } from './components/TutorialIntroOverlay';
import { TutorialCompleteOverlay } from './components/TutorialCompleteOverlay';
import { TaskMenu } from './components/TaskMenu';
import { TaskEndOverlay } from './components/TaskEndOverlay';
import { RewardScreen } from './components/RewardScreen';
import { PreSurveyOverlay, PreSurveyData } from './components/PreSurveyOverlay';

import { useTaskLogger } from './hooks/useTaskLogger';
import { useLatinSquare } from './hooks/useLatinSquare';

import { detectLang, t } from './utils/i18n';
import type { Lang } from './utils/i18n';

import { submitToNetlify } from './utils/netlify';
import type { Category, TaskLog, EasingFunction } from './types/experiment';
import { MAX_TASKS, TIME_LIMIT_MS, FIXED_TASKS_JA, FIXED_TASKS_EN } from './utils/taskData';

type AppState =
  | 'consent'
  | 'pre-survey'
  | 'ready'
  | 'tutorial-intro'
  | 'tutorial'
  | 'tutorial-complete'
  | 'task'
  | 'task-end'
  | 'reward';

function findPathToLeaf(
  categories: Category[],
  targetName: string,
  currentPath: string[] = []
): string[] | null {
  for (const cat of categories) {
    const newPath = [...currentPath, cat.name];
    if (cat.name === targetName) {
      return newPath;
    }
    if (cat.subcategories && cat.subcategories.length > 0) {
      const result = findPathToLeaf(cat.subcategories, targetName, newPath);
      if (result) return result;
    }
  }
  return null;
}

// ... 既存のインポートは同じ ...

export default function App() {
  const lang: Lang = detectLang();
  
  const [appState, setAppState] = useState<AppState>('consent');
  const [participantId] = useState(() => Math.floor(Math.random() * 10000));
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [allLogs, setAllLogs] = useState<TaskLog[]>([]);
  const [preSurveyData, setPreSurveyData] = useState<PreSurveyData | null>(null);
  const [taskInfo, setTaskInfo] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'timeout' | ''>('');
  const [currentCorrectPath, setCurrentCorrectPath] = useState<string[]>([]);
  const [currentEasing, setCurrentEasing] = useState<EasingFunction>('linear');
  const [targetItem, setTargetItem] = useState('');
  const timeoutIdRef = useRef<number | null>(null);

  const taskLogger = useTaskLogger();

  // カテゴリ読み込み（既存のまま）
  useEffect(() => {
    const categoryFile = lang === 'en' ? '/menu_categories_en.json' : '/menu_categories.json';
    fetch(categoryFile)
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories);
        const FIXED_TASKS = lang === 'en' ? FIXED_TASKS_EN : FIXED_TASKS_JA;
        FIXED_TASKS.forEach((task, index) => {
          const path = findPathToLeaf(data.categories, task.item);
          if (!path) {
            console.warn(`タスク${index + 1}のアイテム (${task.item})がメニューにありません`);
          }
        });
      })
      .catch(err => console.error('カテゴリー取得エラー:', err));
  }, [lang]);

  // 🔥 修正：同意後は事前アンケートへ
  const handleConsentAgree = useCallback(() => {
    setAppState('pre-survey');  // 'ready' → 'pre-survey' に変更
  }, []);

  const handleConsentDisagree = useCallback(() => {
    alert(t(lang, 'disagreeAlert'));
  }, [lang]);

  // 🔥 修正：事前アンケート完了後にreadyへ
  const handlePreSurveyComplete = useCallback((data: PreSurveyData) => {
    setPreSurveyData(data);
    console.log('事前アンケート結果:', data);
    setAppState('ready');  // これでOK
  }, []);

  // 🔥 修正：チュートリアル開始時はイントロへ
  const handleStartTutorial = useCallback(() => {
    setAppState('tutorial-intro');  // 'pre-survey' → 'tutorial-intro' に変更
  }, []);

  const handleTutorialIntroClose = useCallback(() => {
    setAppState('tutorial');
    taskLogger.resetTask();  // 🔥 追加
    setTaskInfo(t(lang, 'tutorialInfo', lang === 'en' ? 'Toilet Paper' : 'トイレットペーパー'));
    setFeedback(null);
    setFeedbackType('');
    timeoutIdRef.current = window.setTimeout(() => {
      setFeedback(t(lang, 'tutorialTimeout'));
      setFeedbackType('timeout');
    }, TIME_LIMIT_MS);
  }, [lang, taskLogger]);

  const handleTutorialItemClick = useCallback((itemName: string) => {
    taskLogger.recordClick(itemName, categories);  // 🔥 追加

    if (itemName !== (lang === 'en' ? 'Toilet Paper' : 'トイレットペーパー')) {
      setFeedback(t(lang, 'tutorialWrong'));
      setFeedbackType('incorrect');
      setTimeout(() => {
        setFeedback(null);
        setFeedbackType('');
      }, 2000);
      return;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setFeedback(t(lang, 'tutorialCorrect'));
    setFeedbackType('correct');
    setAppState('tutorial-complete');
  }, [lang, categories, taskLogger]);  // 🔥 依存配列を追加

  const handleTutorialCompleteClose = useCallback(() => {
    setAppState('ready');
    setFeedback(null);
    setFeedbackType('');
    setTaskInfo('');
  }, []);

  const handleStartTask = useCallback(() => {
    if (!confirm(t(lang, 'startTaskConfirm'))) return;  // 🔥 確認ダイアログを追加
    setAllLogs([]);
    setCurrentTaskIndex(1);
    setAppState('task');
  }, [lang]);

  // ... 残りのコードは既存のまま ...

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景（既存のまま） */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-shift"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* 言語スイッチャー - 🔥 常に表示 */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 glass-effect rounded-full px-4 py-2 shadow-lg">
        <a href="?lang=ja" className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors">
          🇯🇵 日本語
        </a>
        <span className="text-gray-400">|</span>
        <a href="?lang=en" className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors">
          🇺🇸 English
        </a>
      </div>

      {/* タイトル */}
      {appState !== 'consent' && appState !== 'pre-survey' && appState !== 'reward' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 pb-6"
        >
          <h1 className="text-4xl md:text-5xl font-black text-center text-white drop-shadow-2xl">
            {t(lang, 'experimentTitle')}
          </h1>
        </motion.div>
      )}

      {/* 🔥 同意画面 */}
      {appState === 'consent' && (
        <ConsentOverlay 
          isVisible={true} 
          lang={lang} 
          onAgree={handleConsentAgree}
          onDisagree={handleConsentDisagree}
        />
      )}

      {/* 🔥 事前アンケート */}
      {appState === 'pre-survey' && (
        <PreSurveyOverlay 
          isVisible={true} 
          lang={lang} 
          onComplete={handlePreSurveyComplete} 
        />
      )}

      {/* チュートリアルイントロ */}
      {appState === 'tutorial-intro' && (
        <TutorialIntroOverlay isVisible={true} lang={lang} onClose={handleTutorialIntroClose} />
      )}

      {/* チュートリアル完了 */}
      {appState === 'tutorial-complete' && (
        <TutorialCompleteOverlay isVisible={true} lang={lang} onClose={handleTutorialCompleteClose} />
      )}

      {/* タスク終了画面 */}
      {appState === 'task-end' && (
        <TaskEndOverlay
          isVisible={true}
          lang={lang}
          isLastTask={currentTaskIndex === MAX_TASKS}
          onContinue={handleTaskEndContinue}
        />
      )}

      {/* 報酬画面 */}
      {appState === 'reward' && (
        <RewardScreen lang={lang} onContinue={handleRewardContinue} allLogs={allLogs} />
      )}

      {/* 準備OK画面 */}
      {appState === 'ready' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-6 mt-20"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartTask}
            className="relative group overflow-hidden rounded-2xl p-[2px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-gradient-shift"></div>
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl px-12 py-5 group-hover:bg-opacity-90 transition-all">
              <span className="text-white font-bold text-2xl flex items-center gap-3">
                {t(lang, 'startTask')}
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </span>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartTutorial}
            className="relative group overflow-hidden rounded-2xl p-[2px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
            <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl px-12 py-5 group-hover:bg-opacity-90 transition-all">
              <span className="text-white font-bold text-2xl flex items-center gap-3">
                📚 {t(lang, 'startTutorial')}
              </span>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* タスク説明とメニュー（既存のまま） */}
      {(appState === 'tutorial' || appState === 'task') && (
        <div className="max-w-6xl mx-auto px-4">
          {/* タスク情報 */}
          {taskInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <div className="inline-block glass-effect rounded-2xl px-8 py-4 shadow-2xl">
                <div className="text-2xl md:text-3xl font-black text-gray-800">
                  {taskInfo}
                </div>
              </div>
            </motion.div>
          )}

          {/* フィードバック表示 */}
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex justify-center mb-6"
              >
                <div className="relative max-w-xl w-full px-4">
                  <div
                    className={`absolute -inset-2 rounded-2xl blur-xl opacity-75 ${
                      feedbackType === 'correct'
                        ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400'
                        : feedbackType === 'incorrect'
                        ? 'bg-gradient-to-r from-red-400 via-pink-400 to-rose-400'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400'
                    }`}
                  />

                  <motion.div
                    animate={feedbackType === 'incorrect' ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`relative px-8 py-5 rounded-2xl shadow-2xl ${
                      feedbackType === 'correct'
                        ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400'
                        : feedbackType === 'incorrect'
                        ? 'bg-gradient-to-r from-red-400 via-pink-400 to-rose-400'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3 text-white">
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="text-3xl"
                      >
                        {feedbackType === 'correct' ? '✓' : feedbackType === 'incorrect' ? '✗' : '⏱'}
                      </motion.span>
                      <span className="font-bold text-xl">{feedback}</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* タスクメニュー表示 */}
          {categories.length > 0 && (
            <div className="flex justify-center mb-10">
              <TaskMenu
                categories={categories}
                currentEasing={currentEasing}
                correctPath={currentCorrectPath}
                isTutorial={appState === 'tutorial'}
                onItemClick={appState === 'tutorial' ? handleTutorialItemClick : handleTaskItemClick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}