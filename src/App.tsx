import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ConsentOverlay } from "./components/ConsentOverlay";
import { TutorialIntroOverlay } from "./components/TutorialIntroOverlay";
import { TutorialCompleteOverlay } from "./components/TutorialCompleteOverlay";
import { TaskMenu } from "./components/TaskMenu";
import { TaskEndOverlay } from "./components/TaskEndOverlay";
import { RewardScreen } from "./components/RewardScreen";
import { PreSurveyOverlay, PreSurveyData } from "./components/PreSurveyOverlay";
import { useTaskLogger } from "./hooks/useTaskLogger";
import { detectLang, t } from "./utils/i18n";
import type { Lang } from "./utils/i18n";
import type { Category, TaskLog, Task } from "./types/experiment";
import { generateLatinSquareTasks } from "./data/task";
import { TIME_LIMIT_MS } from "./utils/taskData";

type AppState =
  | "consent"
  | "pre-survey"
  | "ready"
  | "tutorial-intro"
  | "tutorial"
  | "tutorial-complete"
  | "task"
  | "task-end"
  | "reward";

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

const LanguageSwitcher = ({
  currentLang,
  onLangChange,
}: {
  currentLang: Lang;
  onLangChange: (lang: Lang) => void;
}) => (
  <div className="fixed top-4 right-4 z-[100] flex gap-2 p-1 bg-white/30 backdrop-blur-sm rounded-full shadow-lg">
    <button
      onClick={() => onLangChange("ja")}
      className={`px-3 py-1.5 text-sm font-bold rounded-full transition-all ${
        currentLang === "ja"
          ? "bg-white text-purple-600 shadow-md"
          : "bg-transparent text-black/70 hover:bg-white/50"
      }`}
    >
      日本語
    </button>
    <button
      onClick={() => onLangChange("en")}
      className={`px-3 py-1.5 text-sm font-bold rounded-full transition-all ${
        currentLang === "en"
          ? "bg-white text-purple-600 shadow-md"
          : "bg-transparent text-black/70 hover:bg-white/50"
      }`}
    >
      English
    </button>
  </div>
);

// チュートリアル用カテゴリー
const TUTORIAL_CATEGORIES: Category[] = [
  {
    name: "日用品",
    subcategories: [
      { name: "トイレットペーパー" },
      { name: "ティッシュ" },
      { name: "洗剤" },
    ],
  },
  {
    name: "食品",
    subcategories: [
      { name: "お米" },
      { name: "パン" },
    ],
  },
];

export default function App() {
  const [lang, setLang] = useState<Lang>(detectLang());
  const [appState, setAppState] = useState<AppState>("ready");
  const [experimentTasks, setExperimentTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [allLogs, setAllLogs] = useState<TaskLog[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "incorrect" | "timeout" | ""
  >("");
  const timeoutIdRef = useRef<number | null>(null);
  const taskLogger = useTaskLogger();

  const handleLangChange = (newLang: Lang) => setLang(newLang);

  const handleConsentAgree = useCallback(() => setAppState("pre-survey"), []);
  const handleConsentDisagree = useCallback(
    () => alert(t(lang, "disagreeAlert")),
    [lang]
  );
  const handlePreSurveyComplete = useCallback((data: PreSurveyData) => {
    console.log("[事前アンケート結果:]", data);
    setAppState("ready");
  }, []);

  const handleStartTutorial = useCallback(
    () => setAppState("tutorial-intro"),
    []
  );

  const handleTutorialIntroClose = useCallback(() => {
    setAppState("tutorial");
    taskLogger.resetTask();
    setFeedback(null);
    setFeedbackType("");
    
    // タイムアウト設定
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(() => {
      setFeedback(t(lang, "tutorialTimeout"));
      setFeedbackType("timeout");
      // タイムアウト後、2秒待ってからチュートリアル完了画面へ
      setTimeout(() => {
        setAppState("tutorial-complete");
        setFeedback(null);
        setFeedbackType("");
      }, 2000);
    }, TIME_LIMIT_MS);
  }, [lang, taskLogger]);

  const handleTutorialItemClick = useCallback(
    (itemName: string) => {
      taskLogger.recordClick(itemName, TUTORIAL_CATEGORIES);
      
      const targetItem = lang === "en" ? "Toilet Paper" : "トイレットペーパー";
      
      if (itemName !== targetItem) {
        setFeedback(t(lang, "tutorialWrong"));
        setFeedbackType("incorrect");
        setTimeout(() => {
          setFeedback(null);
          setFeedbackType("");
        }, 2000);
        return;
      }
      
      // 正解
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setFeedback(t(lang, "tutorialCorrect"));
      setFeedbackType("correct");
      
      setTimeout(() => {
        setAppState("tutorial-complete");
      }, 1500);
    },
    [lang, taskLogger]
  );

  const handleTutorialCompleteClose = useCallback(() => {
    setAppState("ready");
    setFeedback(null);
    setFeedbackType("");
  }, []);

  const handleStartTask = useCallback(() => {
    if (!confirm(t(lang, "startTaskConfirm"))) return;
    
    // ラテン方格でタスク生成（参加者番号は仮に1を使用）
    const participantId = Date.now() % 100; // 簡易的な参加者ID
    const tasks = generateLatinSquareTasks(participantId);
    
    setExperimentTasks(tasks);
    setAllLogs([]);
    setCurrentTaskIndex(0);
    setCurrentTask(tasks[0]);
    setAppState("task");
    taskLogger.resetTask();
    
    // タイムアウト設定
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(() => {
      handleTaskTimeout();
    }, TIME_LIMIT_MS);
  }, [lang]);

  // タスクタイムアウト処理
  const handleTaskTimeout = useCallback(() => {
    console.log("[タイムアウト]");
    
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    setFeedback("タイムアウト!");
    setFeedbackType("timeout");
    
    setTimeout(() => {
      setFeedback(null);
      setFeedbackType("");
      
      const nextIndex = currentTaskIndex + 1;
      if (nextIndex < experimentTasks.length) {
        // 次のタスクへ
        setCurrentTaskIndex(nextIndex);
        setCurrentTask(experimentTasks[nextIndex]);
        taskLogger.resetTask();
        
        // 新しいタイムアウトを設定
        timeoutIdRef.current = window.setTimeout(() => {
          handleTaskTimeout();
        }, TIME_LIMIT_MS);
      } else {
        // 全タスク完了
        setAppState("task-end");
      }
    }, 2000);
  }, [currentTaskIndex, experimentTasks, taskLogger]);

  // タスク実行用onItemClick
  const handleTaskItemClick = useCallback(
    (itemName: string, isCorrectPath: boolean) => {
      if (!currentTask) return;
      
      taskLogger.recordClick(itemName, currentTask.categories);
      
      // 目標アイテム（targetPathの最後の要素）
      const targetItem = currentTask.targetPath[currentTask.targetPath.length - 1];
      
      console.log("[クリック]", itemName, "目標:", targetItem, "正しいパス:", isCorrectPath);
      
      // 最終目標に到達したかチェック
      if (itemName === targetItem) {
        // 正解!
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        
        setFeedback("正解!");
        setFeedbackType("correct");
        
        setTimeout(() => {
          setFeedback(null);
          setFeedbackType("");
          
          const nextIndex = currentTaskIndex + 1;
          if (nextIndex < experimentTasks.length) {
            // 次のタスクへ
            setCurrentTaskIndex(nextIndex);
            setCurrentTask(experimentTasks[nextIndex]);
            taskLogger.resetTask();
            
            // 新しいタイムアウトを設定
            timeoutIdRef.current = window.setTimeout(() => {
              handleTaskTimeout();
            }, TIME_LIMIT_MS);
          } else {
            // 全タスク完了
            setAppState("task-end");
          }
        }, 1500);
      } else if (!isCorrectPath) {
        // 間違ったパス
        setFeedback("不正解");
        setFeedbackType("incorrect");
        setTimeout(() => {
          setFeedback(null);
          setFeedbackType("");
        }, 1000);
      }
      // isCorrectPathがtrueだが目標でない場合は、中間フォルダを開いただけなので何もしない
    },
    [currentTask, currentTaskIndex, experimentTasks, taskLogger, handleTaskTimeout]
  );

  // appStateが変わった時のクリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [appState]);

  // 画面描画
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      <LanguageSwitcher currentLang={lang} onLangChange={handleLangChange} />

      {appState !== "consent" &&
        appState !== "pre-survey" &&
        appState !== "reward" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-8 pb-6"
          >
            <h1 className="text-4xl md:text-5xl font-black text-center text-gray-800 drop-shadow-lg">
              {t(lang, "experimentTitle")}
            </h1>
            {appState === "task" && currentTask && (
              <div className="text-center mt-4">
                <span className="text-lg font-semibold text-gray-600">
                  タスク {currentTaskIndex + 1} / {experimentTasks.length}
                </span>
                <span className="ml-4 text-sm text-gray-500">
                  難易度: {currentTask.difficulty === "easy" ? "簡単" : currentTask.difficulty === "medium" ? "中程度" : "難しい"}
                </span>
              </div>
            )}
          </motion.div>
        )}

      <AnimatePresence mode="wait">
        {appState === "consent" && (
          <ConsentOverlay
            key="consent"
            isVisible={true}
            lang={lang}
            onAgree={handleConsentAgree}
            onDisagree={handleConsentDisagree}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appState === "pre-survey" && (
          <PreSurveyOverlay
            key="pre-survey"
            isVisible={true}
            lang={lang}
            onComplete={handlePreSurveyComplete}
          />
        )}
      </AnimatePresence>

      <TutorialIntroOverlay
        isVisible={appState === "tutorial-intro"}
        lang={lang}
        onClose={handleTutorialIntroClose}
      />
      <TutorialCompleteOverlay
        isVisible={appState === "tutorial-complete"}
        lang={lang}
        onClose={handleTutorialCompleteClose}
      />

      {appState === "task-end" && (
        <TaskEndOverlay
          isVisible={true}
          lang={lang}
          isLastTask={true}
          onContinue={() => setAppState("reward")}
        />
      )}

      {appState === "reward" && (
        <RewardScreen
          lang={lang}
          allLogs={allLogs}
          onContinue={() => setAppState("consent")}
        />
      )}

      {appState === "ready" && (
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
                {t(lang, "startTask")}
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
                📚 {t(lang, "startTutorial")}
              </span>
            </div>
          </motion.button>
        </motion.div>
      )}

      {appState === "tutorial" && (
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="inline-block glass-effect rounded-2xl px-8 py-4 shadow-2xl">
              <div className="text-2xl md:text-3xl font-black text-gray-800">
                「トイレットペーパー」を探してクリックしてください
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex justify-center mb-6"
              >
                <div className="relative max-w-xl w-full px-4">
                  <div
                    className={`absolute -inset-2 rounded-2xl blur-xl opacity-75 ${
                      feedbackType === "correct"
                        ? "bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"
                        : feedbackType === "incorrect"
                        ? "bg-gradient-to-r from-red-400 via-pink-400 to-rose-400"
                        : "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"
                    }`}
                  />
                  <motion.div
                    animate={
                      feedbackType === "incorrect"
                        ? { x: [-5, 5, -5, 5, 0] }
                        : {}
                    }
                    transition={{ duration: 0.4 }}
                    className={`relative px-8 py-5 rounded-2xl shadow-2xl text-white ${
                      feedbackType === "correct"
                        ? "bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"
                        : feedbackType === "incorrect"
                        ? "bg-gradient-to-r from-red-400 via-pink-400 to-rose-400"
                        : "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="text-3xl"
                      >
                        {feedbackType === "correct"
                          ? "✓"
                          : feedbackType === "incorrect"
                          ? "✗"
                          : "⏱"}
                      </motion.span>
                      <span className="font-bold text-xl">{feedback}</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center mb-10">
            <TaskMenu
              categories={TUTORIAL_CATEGORIES}
              currentEasing={"linear"}
              correctPath={["日用品", "トイレットペーパー"]}
              isTutorial={true}
              onItemClick={handleTutorialItemClick}
            />
          </div>
        </div>
      )}

      {appState === "task" && currentTask && (
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="inline-block glass-effect rounded-2xl px-8 py-4 shadow-2xl">
              <div className="text-2xl md:text-3xl font-black text-gray-800">
                {currentTask.description}
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex justify-center mb-6"
              >
                <div className="relative max-w-xl w-full px-4">
                  <div
                    className={`absolute -inset-2 rounded-2xl blur-xl opacity-75 ${
                      feedbackType === "correct"
                        ? "bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"
                        : feedbackType === "incorrect"
                        ? "bg-gradient-to-r from-red-400 via-pink-400 to-rose-400"
                        : "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"
                    }`}
                  />
                  <motion.div
                    animate={
                      feedbackType === "incorrect"
                        ? { x: [-5, 5, -5, 5, 0] }
                        : {}
                    }
                    transition={{ duration: 0.4 }}
                    className={`relative px-8 py-5 rounded-2xl shadow-2xl text-white ${
                      feedbackType === "correct"
                        ? "bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"
                        : feedbackType === "incorrect"
                        ? "bg-gradient-to-r from-red-400 via-pink-400 to-rose-400"
                        : "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="text-3xl"
                      >
                        {feedbackType === "correct"
                          ? "✓"
                          : feedbackType === "incorrect"
                          ? "✗"
                          : "⏱"}
                      </motion.span>
                      <span className="font-bold text-xl">{feedback}</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center mb-10">
            <TaskMenu
              categories={currentTask.categories}
              currentEasing={"linear"}
              correctPath={currentTask.targetPath}
              isTutorial={false}
              onItemClick={handleTaskItemClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}