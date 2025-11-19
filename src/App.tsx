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
import type { Category, TaskLog, EasingFunction } from "./types/experiment";
import {
  generateTaskSequence,
  TIME_LIMIT_MS,
  TaskDefinition,
} from "./utils/task";

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

interface TaskWithEasing {
  trial: number;
  task: TaskDefinition;
  easing: EasingFunction;
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
    subcategories: [{ name: "お米" }, { name: "パン" }],
  },
];

export default function App() {
  const [lang, setLang] = useState<Lang>(detectLang());
  const [appState, setAppState] = useState<AppState>("ready");
  const [menuCategories, setMenuCategories] = useState<Category[]>([]);
  const [experimentTasks, setExperimentTasks] = useState<TaskWithEasing[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentTaskWithEasing, setCurrentTaskWithEasing] =
    useState<TaskWithEasing | null>(null);
  const [allLogs, setAllLogs] = useState<TaskLog[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "incorrect" | "timeout" | ""
  >("");
  const timeoutIdRef = useRef<number | null>(null);
  const taskLogger = useTaskLogger();

  // イージング関数選択を管理
  const [currentEasing, setCurrentEasing] = useState<EasingFunction>("linear");

  // カテゴリデータ読み込み
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/menu_categories.json");
        const data = await response.json();
        setMenuCategories(data.categories);
        console.log("✅ カテゴリ読み込み完了:", data.categories.length);
      } catch (error) {
        console.error("❌ menu_categories.json の読み込みエラー:", error);
      }
    };
    loadCategories();
  }, []);

  // 各種ハンドラー（省略...過去回答参照）
  const handleLangChange = (newLang: Lang) => setLang(newLang);
  const handleConsentAgree = useCallback(() => setAppState("pre-survey"), []);
  const handleConsentDisagree = useCallback(
    () => alert(t(lang, "disagreeAlert")),
    [lang]
  );
  const handlePreSurveyComplete = useCallback((data: PreSurveyData) => {
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
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(() => {
      setFeedback(t(lang, "tutorialTimeout"));
      setFeedbackType("timeout");
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
    if (menuCategories.length === 0) {
      alert(
        "カテゴリの読み込みに失敗しました。ページを再読み込みしてください。"
      );
      return;
    }
    const participantId = Date.now() % 5;
    const taskSequence = generateTaskSequence(participantId);
    setExperimentTasks(taskSequence);
    setAllLogs([]);
    setCurrentTaskIndex(0);
    setCurrentTaskWithEasing(taskSequence[0]);
    setAppState("task");
    taskLogger.resetTask();
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(() => {
      handleTaskTimeout();
    }, TIME_LIMIT_MS);
  }, [lang, menuCategories]);
  const handleTaskTimeout = useCallback(() => {
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
        setCurrentTaskIndex(nextIndex);
        setCurrentTaskWithEasing(experimentTasks[nextIndex]);
        taskLogger.resetTask();
        timeoutIdRef.current = window.setTimeout(() => {
          handleTaskTimeout();
        }, TIME_LIMIT_MS);
      } else {
        setAppState("task-end");
      }
    }, 2000);
  }, [currentTaskIndex, experimentTasks, taskLogger]);

  const handleTaskItemClick = useCallback(
    (itemName: string, isCorrectPath: boolean) => {
      if (!currentTaskWithEasing) return;
      taskLogger.recordClick(itemName, menuCategories);
      const targetItem =
        currentTaskWithEasing.task.targetPath[
          currentTaskWithEasing.task.targetPath.length - 1
        ];
      if (itemName === targetItem) {
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
            setCurrentTaskIndex(nextIndex);
            setCurrentTaskWithEasing(experimentTasks[nextIndex]);
            taskLogger.resetTask();
            timeoutIdRef.current = window.setTimeout(() => {
              handleTaskTimeout();
            }, TIME_LIMIT_MS);
          } else {
            setAppState("task-end");
          }
        }, 1500);
      } else if (!isCorrectPath) {
        setFeedback("不正解");
        setFeedbackType("incorrect");
        setTimeout(() => {
          setFeedback(null);
          setFeedbackType("");
        }, 1000);
      }
    },
    [
      currentTaskWithEasing,
      currentTaskIndex,
      experimentTasks,
      taskLogger,
      handleTaskTimeout,
      menuCategories,
    ]
  );

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [appState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative overflow-hidden flex flex-col">
      <LanguageSwitcher currentLang={lang} onLangChange={handleLangChange} />
      {appState !== "consent" &&
        appState !== "pre-survey" &&
        appState !== "reward" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 pb-4 flex-shrink-0"
          >
            <h1 className="text-3xl md:text-4xl font-black text-center text-gray-800">
              {t(lang, "experimentTitle")}
            </h1>
          </motion.div>
        )}
      <div className="flex-grow">
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
        {(appState === "tutorial" ||
          (appState === "task" &&
            currentTaskWithEasing &&
            menuCategories.length > 0)) && (
          <div className="flex h-full w-full max-w-7xl mx-auto px-4 gap-6">
            <div className="flex-1 max-w-4xl mx-auto px-4 pt-4 pb-8 overflow-auto">
              {appState === "tutorial" && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="bg-white rounded-2xl px-8 py-6 shadow-xl border border-gray-200">
                      <div className="text-2xl md:text-3xl font-black text-gray-800 text-center">
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
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="mb-6"
                      >
                        <div
                          className={`
                            px-8 py-5 rounded-2xl shadow-2xl text-white
                            ${
                              feedbackType === "correct"
                                ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                : ""
                            }
                            ${
                              feedbackType === "incorrect"
                                ? "bg-gradient-to-r from-red-400 to-pink-500"
                                : ""
                            }
                            ${
                              feedbackType === "timeout"
                                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                : ""
                            }
                          `}
                        >
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl">
                              {feedbackType === "correct"
                                ? "✓"
                                : feedbackType === "incorrect"
                                ? "✗"
                                : "⏱"}
                            </span>
                            <span className="font-bold text-xl">
                              {feedback}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
              {appState === "task" && currentTaskWithEasing && (
                <>
                  <div className="text-center mb-4">
                    <span className="inline-block bg-white px-6 py-2 rounded-full shadow-md border border-gray-200">
                      <span className="text-lg font-bold text-gray-800">
                        タスク {currentTaskIndex + 1} / {experimentTasks.length}
                      </span>
                    </span>
                  </div>
                  <motion.div
                    key={currentTaskIndex}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <div className="bg-white rounded-2xl px-8 py-6 shadow-xl border border-gray-200">
                      <div className="text-2xl md:text-3xl font-black text-gray-800 text-center">
                        {currentTaskWithEasing.task.description}
                      </div>
                    </div>
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="mb-6"
                      >
                        <div
                          className={`
                            px-8 py-5 rounded-2xl shadow-2xl text-white
                            ${
                              feedbackType === "correct"
                                ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                : ""
                            }
                            ${
                              feedbackType === "incorrect"
                                ? "bg-gradient-to-r from-red-400 to-pink-500"
                                : ""
                            }
                            ${
                              feedbackType === "timeout"
                                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                : ""
                            }
                          `}
                        >
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl">
                              {feedbackType === "correct"
                                ? "✓"
                                : feedbackType === "incorrect"
                                ? "✗"
                                : "⏱"}
                            </span>
                            <span className="font-bold text-xl">
                              {feedback}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
            {/* 右側サイドバー（TaskMenu呼び出し） */}
            <div className="w-96 flex-shrink-0 bg-gray-50/50 backdrop-blur-sm border-l border-gray-200 p-4 pt-6 overflow-y-auto">
              <TaskMenu
                categories={
                  appState === "tutorial" ? TUTORIAL_CATEGORIES : menuCategories
                }
                currentEasing={currentEasing}
                setCurrentEasing={setCurrentEasing}
                correctPath={
                  appState === "tutorial"
                    ? ["日用品", "トイレットペーパー"]
                    : currentTaskWithEasing?.task.targetPath ?? []
                }
                isTutorial={appState === "tutorial"}
                onItemClick={
                  appState === "tutorial"
                    ? handleTutorialItemClick
                    : handleTaskItemClick
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
