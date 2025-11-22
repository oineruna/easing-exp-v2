// --- START OF FILE src/App.tsx ---

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ConsentOverlay } from "./components/ConsentOverlay";
import { TutorialIntroOverlay } from "./components/TutorialIntroOverlay";
import { TutorialCompleteOverlay } from "./components/TutorialCompleteOverlay";
import { TaskMenu } from "./components/TaskMenu";
import { TaskEndOverlay } from "./components/TaskEndOverlay";
import { RewardScreen } from "./components/RewardScreen";
import { PreSurveyOverlay } from "./components/PreSurveyOverlay";
import { NextTaskOverlay } from "./components/NextTaskOverlay";
import { TaskSurveyOverlay } from "./components/TaskSurveyOverlay";
// ★ 新規追加
import { PostSurveyOverlay } from "./components/PostSurveyOverlay";

import { useTaskLogger } from "./useTaskLogger";
import { detectLang, t } from "./utils/i18n";
import type { Lang } from "./experiment";
import type {
  Category,
  TaskLog,
  Task,
  EasingFunction,
  PostSurveyResult,
  ExperimentData,
  PreSurveyData,
} from "./experiment";
import {
  loadMenuCategories,
  loadTutorialCategories,
  generateTaskSequence,
  generateTasksFromCategories,
  TIME_LIMIT_MS,
} from "./utils/task";

type AppState =
  | "consent"
  | "pre-survey"
  | "ready"
  | "tutorial-intro"
  | "tutorial"
  | "tutorial-complete"
  | "task"
  | "seq"
  | "next-task-ready"
  | "task-end"
  | "reward"
  | "post-survey"; // ★ 追加

interface TaskWithEasing {
  trial: number;
  task: Task;
  easing: EasingFunction;
}

const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export default function App() {
  const [lang, setLang] = useState<Lang>("ja");
  const [appState, setAppState] = useState<AppState>("consent");
  const [participantId, setParticipantId] = useState<string>("");

  const [menuCategories, setMenuCategories] = useState<Category[]>([]);
  const [tutorialCategories, setTutorialCategories] = useState<Category[]>([]);

  const [experimentTasks, setExperimentTasks] = useState<TaskWithEasing[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentTaskWithEasing, setCurrentTaskWithEasing] =
    useState<TaskWithEasing | null>(null);

  const [allLogs, setAllLogs] = useState<TaskLog[]>([]);
  const [preSurveyData, setPreSurveyData] = useState<PreSurveyData | null>(
    null
  );
  const [tempTaskLog, setTempTaskLog] = useState<TaskLog | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "incorrect" | "timeout" | ""
  >("");
  // ★ 実験開始確認用ステート
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  const currentEasing: EasingFunction =
    currentTaskWithEasing?.easing || "easeInOutExpo";

  const timeoutIdRef = useRef<number | null>(null);
  const taskLogger = useTaskLogger();

  // 初期化 & localStorage復元確認
  useEffect(() => {
    setLang(detectLang());
    const url = new URL(window.location.href);
    const params = url.searchParams;
    let id = params.get("pid") || params.get("id");

    if (!id) {
      id = Math.floor(1000 + Math.random() * 9000).toString();
    }

    setParticipantId(id);
    params.set("pid", id);
    window.history.replaceState(null, "", url.toString());

    // localStorage からバックアップを確認
    const backup = localStorage.getItem(`experiment_backup_${id}`);
    if (backup) {
      const shouldRestore = window.confirm(
        lang === "ja"
          ? "前回の実験データが見つかりました。続きから再開しますか？"
          : "Previous experiment data found. Resume from where you left off?"
      );
      if (shouldRestore) {
        try {
          const data = JSON.parse(backup);
          setAllLogs(data.tasks || []);
          setPreSurveyData(data.preSurvey || null);
          setCurrentTaskIndex(data.currentTaskIndex || 0);
          console.log("[Backup] Restored from localStorage", data);
        } catch (e) {
          console.error("[Backup] Failed to restore", e);
        }
      } else {
        localStorage.removeItem(`experiment_backup_${id}`);
      }
    }
  }, []);

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      const mainCats = await loadMenuCategories(lang);
      setMenuCategories(mainCats);
      const tutCats = await loadTutorialCategories(lang);
      setTutorialCategories(tutCats);
    };
    loadData();
  }, [lang]);

  // localStorage 自動バックアップ（5タスクごと）
  useEffect(() => {
    if (allLogs.length > 0 && allLogs.length % 5 === 0) {
      const backupData = {
        participantId,
        preSurvey: preSurveyData,
        tasks: allLogs,
        currentTaskIndex,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        `experiment_backup_${participantId}`,
        JSON.stringify(backupData)
      );
      console.log(`[Backup] Auto-saved at task ${allLogs.length}`);
    }
  }, [allLogs.length, participantId, preSurveyData, currentTaskIndex]);

  // --- ハンドラー ---

  const handleConsentAgree = useCallback(() => setAppState("pre-survey"), []);
  const handleConsentDisagree = useCallback(
    () => alert(t(lang, "disagreeAlert")),
    [lang]
  );
  const handlePreSurveyComplete = useCallback((data: PreSurveyData) => {
    console.log("[Pre-Survey]", data);
    setPreSurveyData(data);
    setAppState("ready");
  }, []);

  const handleStartTutorial = useCallback(
    () => setAppState("tutorial-intro"),
    []
  );
  const handleTutorialIntroClose = useCallback(
    () => setAppState("tutorial"),
    []
  );
  const handleTutorialCompleteClose = useCallback(
    () => setAppState("ready"),
    []
  );

  const handleTutorialItemClick = useCallback(
    (itemName: string) => {
      const targetItem = lang === "en" ? "Tents" : "テント";
      if (itemName === targetItem) {
        setFeedback(t(lang, "tutorialCorrect"));
        setFeedbackType("correct");
        setTimeout(() => setAppState("tutorial-complete"), 1000);
      } else {
        setFeedback(t(lang, "tutorialWrong"));
        setFeedbackType("incorrect");
        setTimeout(() => setFeedback(null), 1000);
      }
    },
    [lang]
  );

  const handleTaskTimeout = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

    setFeedback(lang === "en" ? "Timeout!" : "タイムアウト!");
    setFeedbackType("timeout");

    const log = taskLogger.stopTask(false, true);
    if (currentTaskWithEasing) {
      const fullLog = {
        ...log,
        participantId,
        trialNumber: currentTaskWithEasing.trial,
        taskId: currentTaskWithEasing.task.id,
        targetItem: currentTaskWithEasing.task.targetPath.join(" > "),
        easingFunction: currentTaskWithEasing.easing,
      } as TaskLog;
      setTempTaskLog(fullLog);
    }

    setTimeout(() => {
      setFeedback(null);
      setFeedbackType("");
      setAppState("seq");
    }, 200);
  }, [currentTaskWithEasing, taskLogger, lang, participantId]);

  const handleStartTask = useCallback(async () => {
    // 確認ダイアログを閉じる
    setShowStartConfirm(false);

    if (menuCategories.length === 0) return;

    const seed = hashCode(participantId);
    const taskDefs = generateTasksFromCategories(menuCategories);
    const taskSequence = generateTaskSequence(seed, taskDefs);

    setExperimentTasks(taskSequence);
    setAllLogs([]);
    setCurrentTaskIndex(0);
    setCurrentTaskWithEasing(taskSequence[0]);
    setTempTaskLog(null);

    setAppState("task");
    taskLogger.resetTask();

    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(
      () => handleTaskTimeout(),
      TIME_LIMIT_MS
    );
  }, [menuCategories, lang, participantId, taskLogger, handleTaskTimeout]);

  const handleTaskItemClick = useCallback(
    (itemName: string, isCorrectPath: boolean) => {
      if (!currentTaskWithEasing) return;
      taskLogger.recordClick(itemName, menuCategories);

      const targetItem =
        currentTaskWithEasing.task.targetPath[
        currentTaskWithEasing.task.targetPath.length - 1
        ];

      if (itemName === targetItem) {
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

        setFeedback(lang === "en" ? "Correct!" : "正解!");
        setFeedbackType("correct");

        const log = taskLogger.stopTask(true, false);
        const fullLog = {
          ...log,
          participantId,
          trialNumber: currentTaskWithEasing.trial,
          taskId: currentTaskWithEasing.task.id,
          targetItem: currentTaskWithEasing.task.targetPath.join(" > "),
          easingFunction: currentTaskWithEasing.easing,
        } as TaskLog;
        setTempTaskLog(fullLog);

        setTimeout(() => {
          setFeedback(null);
          setFeedbackType("");
          setAppState("seq");
        }, 200);
      } else if (!isCorrectPath) {
        setFeedback(lang === "en" ? "Incorrect" : "不正解");
        setFeedbackType("incorrect");
        setTimeout(() => {
          setFeedback(null);
          setFeedbackType("");
        }, 1000);
      }
    },
    [currentTaskWithEasing, menuCategories, taskLogger, lang, participantId]
  );

  const handleSurveyComplete = useCallback(
    (data: any) => {
      if (tempTaskLog) {
        const completedLog: TaskLog = { ...tempTaskLog, survey: data };
        setAllLogs((prev) => [...prev, completedLog]);
      }
      const nextIndex = currentTaskIndex + 1;
      if (nextIndex < experimentTasks.length) {
        setAppState("next-task-ready");
      } else {
        setAppState("task-end");
      }
    },
    [currentTaskIndex, experimentTasks.length, tempTaskLog]
  );

  const handleNextTaskStart = useCallback(() => {
    const nextIndex = currentTaskIndex + 1;
    setCurrentTaskIndex(nextIndex);
    setCurrentTaskWithEasing(experimentTasks[nextIndex]);

    setAppState("task");
    taskLogger.resetTask();

    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(
      () => handleTaskTimeout(),
      TIME_LIMIT_MS
    );
  }, [currentTaskIndex, experimentTasks, taskLogger, handleTaskTimeout]);

  // ★ 事後アンケート完了＆データ保存
  const handlePostSurveyComplete = useCallback(
    (surveyData: PostSurveyResult) => {
      // Pre-Survey データのチェック
      if (!preSurveyData) {
        const proceed = window.confirm(
          lang === "ja"
            ? "事前アンケートのデータが見つかりません。このまま続けますか？"
            : "Pre-survey data not found. Continue anyway?"
        );
        if (!proceed) {
          return;
        }
      }

      // 最終データの構築
      const finalData: ExperimentData = {
        participantId,
        timestamp: new Date().toISOString(),
        preSurvey: preSurveyData!,
        tasks: allLogs,
        postSurvey: surveyData,
      };

      // JSONダウンロード
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(finalData, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute(
        "download",
        `experiment_data_${participantId}.json`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      // localStorage バックアップを削除
      localStorage.removeItem(`experiment_backup_${participantId}`);
      console.log("[Backup] Cleared backup after successful completion");

      // 完了後、同意画面に戻る
      alert(
        lang === "ja"
          ? "実験データが保存されました。ご協力ありがとうございました。\nこのタブを閉じて終了してください。"
          : "Data saved. Thank you!\nPlease close this tab."
      );
      // タブを閉じる試行
      window.close();
      // 閉じられなかった場合はConsentに戻る（あるいは終了画面のままにする）
      setAppState("consent");

      // 必要ならIDをリセットする処理など
    },
    [allLogs, participantId, lang, preSurveyData]
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <ConsentOverlay
        isVisible={appState === "consent"}
        lang={lang}
        onAgree={handleConsentAgree}
        onDisagree={handleConsentDisagree}
        onLanguageChange={setLang}
      />

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

      {appState === "seq" && (
        <TaskSurveyOverlay
          isVisible={true}
          lang={lang}
          taskNumber={currentTaskIndex + 1}
          onComplete={handleSurveyComplete}
        />
      )}
      <NextTaskOverlay
        isVisible={appState === "next-task-ready"}
        lang={lang}
        nextTaskNumber={currentTaskIndex + 2}
        totalTasks={experimentTasks.length}
        onNext={handleNextTaskStart}
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
          allLogs={allLogs}
          lang={lang}
          participantId={participantId}
          // ★ 修正: Consentに戻るのではなく、事後アンケート(post-survey)に進む
          onContinue={() => setAppState("post-survey")}
        />
      )}

      {/* ★ 事後アンケートオーバーレイ */}
      {appState === "post-survey" && (
        <PostSurveyOverlay
          isVisible={true}
          lang={lang}
          participantId={participantId}
          onComplete={handlePostSurveyComplete}
        />
      )}

      <AnimatePresence>
        {appState === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass-effect rounded-3xl p-12 shadow-2xl text-center max-w-2xl w-full mx-4"
            >
              <h1 className="text-3xl font-black mb-8 gradient-text">
                {lang === "ja" ? "実験開始" : "Ready to Start"}
              </h1>
              <div className="mb-8 bg-white/50 py-3 px-6 rounded-xl inline-block border border-gray-200">
                <span className="text-gray-500 text-sm font-bold mr-2">
                  ID:
                </span>
                <span className="text-gray-800 font-mono font-bold text-xl tracking-widest">
                  {participantId}
                </span>
              </div>
              <div className="flex gap-4 justify-center mb-4">
                {!showStartConfirm ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowStartConfirm(true)}
                      className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition"
                    >
                      {lang === "en" ? "Start Task" : "タスク開始"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartTutorial}
                      className="px-10 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-lg shadow-md hover:bg-gray-50 transition"
                    >
                      {lang === "en" ? "Tutorial" : "チュートリアル"}
                    </motion.button>
                  </>
                ) : (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <p className="text-lg font-bold text-gray-800 mb-4">
                      {lang === "ja"
                        ? "本当に開始しますか？"
                        : "Are you sure you want to start?"}
                    </p>
                    <div className="flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartTask}
                        className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 transition"
                      >
                        {lang === "ja" ? "開始する" : "Yes, Start"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowStartConfirm(false)}
                        className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-300 transition"
                      >
                        {lang === "ja" ? "キャンセル" : "Cancel"}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {(appState === "tutorial" ||
        appState === "task" ||
        appState === "seq" ||
        appState === "next-task-ready") && (
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200 py-3 px-8 sticky top-0 z-20 shadow-sm flex items-center justify-between">
              <div className="font-bold text-gray-400">
                EXPERIMENT{" "}
                <span className="ml-2 text-xs font-mono text-gray-300">
                  {participantId}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Easing:{" "}
                <span className="font-bold text-blue-600">{currentEasing}</span>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-12 relative overflow-hidden">
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">
                      Current Target
                    </div>
                    <h2 className="text-3xl font-black">
                      {appState !== "tutorial" && currentTaskWithEasing
                        ? currentTaskWithEasing.task.description
                        : lang === "en"
                          ? "Find 'Tents'"
                          : "「テント」を探してクリックしてください"}
                    </h2>
                  </div>
                </div>

                <div className="h-12 mb-4 flex items-center justify-center pointer-events-none z-30 relative">
                  <AnimatePresence mode="wait">
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-8 py-2 rounded-full text-white font-bold shadow-lg ${feedbackType === "correct"
                            ? "bg-green-500"
                            : feedbackType === "timeout"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                      >
                        {feedback}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative h-[500px] z-0">
                  {appState === "tutorial" && (
                    <TaskMenu
                      key="tutorial-menu"
                      categories={tutorialCategories}
                      currentEasing={currentEasing}
                      correctPath={["...", "...", "..."]}
                      isTutorial={true}
                      onItemClick={handleTutorialItemClick}
                    />
                  )}
                  {appState !== "tutorial" &&
                    currentTaskWithEasing &&
                    menuCategories.length > 0 && (
                      <TaskMenu
                        key={currentTaskWithEasing.trial}
                        categories={menuCategories}
                        currentEasing={currentEasing}
                        correctPath={currentTaskWithEasing.task.targetPath}
                        isTutorial={false}
                        onItemClick={
                          appState === "task" ? handleTaskItemClick : () => { }
                        }
                      />
                    )}
                </div>
              </div>
            </main>
          </div>
        )}
    </div>
  );
}
