import { useState, useEffect, useCallback, useRef } from 'react';
import { ConsentOverlay } from './components/ConsentOverlay';
import { TutorialIntroOverlay } from './components/TutorialIntroOverlay';
import { TutorialCompleteOverlay } from './components/TutorialCompleteOverlay';
import { TaskMenu } from './components/TaskMenu';
import { TaskEndOverlay } from './components/TaskEndOverlay';
import { RewardScreen } from './components/RewardScreen';
import { useTaskLogger } from './hooks/useTaskLogger';
import { useLatinSquare } from './hooks/useLatinSquare';
import { detectLang, t } from './utils/i18n';
import type { Lang } from './utils/i18n';
import { submitToNetlify } from './utils/netlify';
import type { Category, TaskLog, EasingFunction } from './types/experiment';
import { MAX_TASKS, TIME_LIMIT_MS, FIXED_TASKS_JA, FIXED_TASKS_EN } from './utils/taskData';

type AppState = 'consent' | 'ready' | 'tutorial-intro' | 'tutorial' | 'tutorial-complete' | 'task' | 'task-end' | 'reward';

function generateParticipantId(): number {
  return Math.floor(Math.random() * 1000);
}

function findPathToLeaf(categories: Category[], targetName: string, currentPath: string[] = []): string[] | null {
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

function App() {
  const [lang] = useState<Lang>(detectLang());
  const [appState, setAppState] = useState<AppState>('consent');
  const [participantId] = useState<number>(() => {
    const id = generateParticipantId();
    const newUrl = `${window.location.pathname}?participant=${id}`;
    window.history.replaceState({}, '', newUrl);
    return id;
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [allLogs, setAllLogs] = useState<TaskLog[]>([]);
  const [taskInfo, setTaskInfo] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'timeout' | ''>('');
  const [currentCorrectPath, setCurrentCorrectPath] = useState<string[]>([]);
  const [currentEasing, setCurrentEasing] = useState<EasingFunction>('linear');
  const [targetItem, setTargetItem] = useState('');

  const timeoutIdRef = useRef<number | null>(null);
  const taskLogger = useTaskLogger();

  const tutorialTargetItem = lang === 'en' ? 'Toilet Paper' : 'トイレットペーパー';

  // Load categories
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
            console.warn(`警告: タスク${index + 1}の商品「${task.item}」がメニューに見つかりませんでした！`);
          }
        });
      })
      .catch(err => console.error('JSON読み込み失敗:', err));
  }, [lang]);

  const handleConsentAgree = useCallback(() => {
    setAppState('ready');
  }, []);

  const handleConsentDisagree = useCallback(() => {
    alert(t(lang, 'disagreeAlert'));
  }, [lang]);

  const handleStartTutorial = useCallback(() => {
    setAppState('tutorial-intro');
  }, []);

  const handleTutorialIntroClose = useCallback(() => {
    if (confirm(t(lang, 'tutorialStartConfirm'))) {
      setAppState('tutorial');
      taskLogger.resetTask();
      setTaskInfo(t(lang, 'tutorialInfo', tutorialTargetItem));
      setFeedback('');
      setFeedbackType('');
      
      timeoutIdRef.current = window.setTimeout(() => {
        setFeedback(t(lang, 'tutorialTimeout'));
        setFeedbackType('timeout');
      }, TIME_LIMIT_MS);
    } else {
      setAppState('ready');
    }
  }, [lang, taskLogger, tutorialTargetItem]);

  const handleTutorialItemClick = useCallback((itemName: string) => {
    taskLogger.recordClick(itemName, categories);

    if (itemName !== tutorialTargetItem) {
      setFeedback(t(lang, 'tutorialWrong'));
      setFeedbackType('incorrect');
      setTimeout(() => {
        setFeedback('');
        setFeedbackType('');
      }, 2000);
      return;
    }

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setFeedback(t(lang, 'tutorialCorrect'));
    setFeedbackType('correct');
    setAppState('tutorial-complete');
  }, [categories, lang, taskLogger, tutorialTargetItem]);

  const handleTutorialCompleteClose = useCallback(() => {
    setAppState('ready');
    setFeedback('');
    setFeedbackType('');
    setTaskInfo('');
  }, []);

  const handleStartTask = useCallback(() => {
    if (!confirm(t(lang, 'startTaskConfirm'))) return;
    setAllLogs([]);
    setCurrentTaskIndex(1);
    setAppState('task');
  }, [lang]);

  const { currentEasing: assignedEasing, currentTask } = useLatinSquare(participantId, currentTaskIndex, lang);

  useEffect(() => {
    if (appState === 'task' && currentTaskIndex > 0 && currentTaskIndex <= MAX_TASKS) {
      taskLogger.resetTask();
      setFeedback('');
      setFeedbackType('');

      const item = currentTask.item;
      setTargetItem(item);
      setCurrentEasing(assignedEasing);
      setTaskInfo(t(lang, 'taskInfo', currentTaskIndex, MAX_TASKS, item));

      const path = findPathToLeaf(categories, item) || [];
      setCurrentCorrectPath(path);

      console.log(`タスク${currentTaskIndex}: イージング=${assignedEasing}, 商品=${item}`);

      timeoutIdRef.current = window.setTimeout(() => {
        handleTaskTimeout(item);
      }, TIME_LIMIT_MS);
    }
  }, [appState, currentTaskIndex]);

  const handleTaskTimeout = useCallback((item: string) => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    setFeedback(t(lang, 'timeout'));
    setFeedbackType('timeout');

    const firstClickTimeSec = typeof taskLogger.firstClickTime === 'number' 
      ? parseFloat(taskLogger.firstClickTime.toFixed(2)) 
      : null;

    const newLog: TaskLog = {
      taskIndex: currentTaskIndex,
      correctItem: item,
      correctPath: [...currentCorrectPath],
      totalTime: (TIME_LIMIT_MS / 1000).toFixed(2),
      errorCount: taskLogger.errorCount,
      timedOut: true,
      usedEasing: currentEasing,
      firstClickTime: firstClickTimeSec,
      menuTravelDistance: taskLogger.menuTravelDistance,
      clicks: taskLogger.clicksThisTask,
    };

    setAllLogs(prev => [...prev, newLog]);
    setAppState('task-end');
  }, [lang, currentTaskIndex, currentCorrectPath, currentEasing, taskLogger]);

  const handleTaskItemClick = useCallback((itemName: string, isCorrectPath: boolean) => {
    taskLogger.recordClick(itemName, categories);

    if (!isCorrectPath) {
      taskLogger.incrementError();
    }

    if (itemName === targetItem) {
      const endTime = performance.now();
      const totalTimeSec = ((endTime - taskLogger.startTimeRef.current) / 1000).toFixed(2);

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      setFeedback(t(lang, 'correct'));
      setFeedbackType('correct');

      const firstClickTimeSec = typeof taskLogger.firstClickTime === 'number'
        ? parseFloat(taskLogger.firstClickTime.toFixed(2))
        : null;

      const newLog: TaskLog = {
        taskIndex: currentTaskIndex,
        correctItem: targetItem,
        correctPath: [...currentCorrectPath],
        totalTime: totalTimeSec,
        errorCount: taskLogger.errorCount,
        timedOut: false,
        usedEasing: currentEasing,
        firstClickTime: firstClickTimeSec,
        menuTravelDistance: taskLogger.menuTravelDistance,
        clicks: taskLogger.clicksThisTask,
      };

      setAllLogs(prev => [...prev, newLog]);
      setAppState('task-end');
    } else if (itemName !== targetItem && !isCorrectPath) {
      setFeedback(t(lang, 'wrong'));
      setFeedbackType('incorrect');
      setTimeout(() => {
        setFeedback('');
        setFeedbackType('');
      }, 2000);
    }
  }, [categories, currentCorrectPath, currentEasing, currentTaskIndex, lang, targetItem, taskLogger]);

  const handleTaskEndContinue = useCallback((survey: {
    animationEaseRating: string;
    taskDifficultyRating: string;
    animationDifferenceRating: string;
    comments: string;
  }) => {
    setFeedback('');
    setFeedbackType('');

    setAllLogs(prev => {
      const newLogs = [...prev];
      const lastLog = newLogs[newLogs.length - 1];
      if (lastLog && lastLog.taskIndex === currentTaskIndex) {
        lastLog.animationEaseRating = survey.animationEaseRating;
        lastLog.taskDifficultyRating = survey.taskDifficultyRating;
        lastLog.animationDifferenceRating = survey.animationDifferenceRating;
        lastLog.comments = survey.comments;
        lastLog.timestamp = new Date().toISOString();
      }
      return newLogs;
    });

    if (currentTaskIndex >= MAX_TASKS) {
      if (!confirm(t(lang, 'toResultConfirm'))) return;
      setAppState('reward');
    } else {
      if (!confirm(t(lang, 'nextConfirm'))) return;
      setCurrentTaskIndex(prev => prev + 1);
      setAppState('task');
    }
  }, [currentTaskIndex, lang]);

  const handleRewardContinue = useCallback(() => {
    submitToNetlify(allLogs, String(participantId));
  }, [allLogs, participantId]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 🎨 アニメーション背景 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-shift"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 glass-effect rounded-full px-4 py-2 shadow-lg">
        <a href="?lang=ja" className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors">
          🇯🇵 日本語
        </a>
        <span className="text-gray-400">|</span>
        <a href="?lang=en" className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors">
          🇺🇸 English
        </a>
      </div>

      {/* Title */}
      <div className="pt-12 pb-6">
        <h1 className="text-4xl md:text-5xl font-black text-center text-white drop-shadow-2xl">
          {t(lang, 'experimentTitle')}
        </h1>
      </div>

      {/* Overlays */}
      <ConsentOverlay
        isVisible={appState === 'consent'}
        lang={lang}
        onAgree={handleConsentAgree}
        onDisagree={handleConsentDisagree}
      />

      <TutorialIntroOverlay
        isVisible={appState === 'tutorial-intro'}
        lang={lang}
        onClose={handleTutorialIntroClose}
      />

      <TutorialCompleteOverlay
        isVisible={appState === 'tutorial-complete'}
        lang={lang}
        onClose={handleTutorialCompleteClose}
      />

      <TaskEndOverlay
        isVisible={appState === 'task-end'}
        lang={lang}
        isLastTask={currentTaskIndex >= MAX_TASKS}
        onContinue={handleTaskEndContinue}
      />

      {/* Main Content */}
      {appState !== 'consent' && appState !== 'reward' && (
        <div className="max-w-6xl mx-auto px-4">
          {/* Control Buttons */}
          {appState === 'ready' && (
            <div className="flex justify-center gap-6 mb-10">
              <button
                onClick={handleStartTask}
                className="group relative px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">{t(lang, 'startTask')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                  {t(lang, 'startTask')} ▶
                </span>
              </button>
              <button
                onClick={handleStartTutorial}
                className="group relative px-8 py-4 bg-white text-green-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">{t(lang, 'startTutorial')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                  {t(lang, 'startTutorial')} 📚
                </span>
              </button>
            </div>
          )}

          {/* Task Info */}
          {(appState === 'tutorial' || appState === 'task') && (
            <div className="text-center mb-6">
              <div className="inline-block glass-effect rounded-2xl px-8 py-4 shadow-2xl">
                <div className="text-2xl md:text-3xl font-black text-gray-800">
                  {taskInfo}
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          {(appState === 'tutorial' || appState === 'task') && (
            <div className="flex justify-center mb-6">
              <div
                className={`min-w-[320px] text-xl font-bold text-center px-6 py-4 rounded-2xl min-h-[60px] flex items-center justify-center transition-all duration-300 shadow-lg ${
                  feedbackType === 'correct'
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white scale-105 shadow-green-500/50'
                    : feedbackType === 'incorrect'
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white scale-105 shadow-red-500/50 animate-shake'
                    : feedbackType === 'timeout'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white scale-105 shadow-yellow-500/50'
                    : 'bg-white/50 backdrop-blur-sm text-transparent'
                }`}
              >
                {feedback || '\u00A0'}
              </div>
            </div>
          )}

          {/* Menu */}
          {(appState === 'tutorial' || appState === 'task') && categories.length > 0 && (
            <div className="flex justify-center pb-10">
              <TaskMenu
                categories={categories}
                currentEasing={currentEasing}
                correctPath={currentCorrectPath}
                isTutorial={appState === 'tutorial'}
                onItemClick={
                  appState === 'tutorial' ? handleTutorialItemClick : handleTaskItemClick
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Reward Screen */}
      {appState === 'reward' && (
        <RewardScreen
          allLogs={allLogs}
          lang={lang}
          onContinue={handleRewardContinue}
        />
      )}

      {/* Hidden Netlify Form */}
      <form name="results" data-netlify="true" hidden>
        <input type="hidden" name="form-name" value="results" />
        <input type="hidden" name="participant" />
        <textarea name="jsonData"></textarea>
      </form>
    </div>
  );
}

export default App;
