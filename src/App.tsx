// --- START OF FILE src/App.tsx ---

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ConsentOverlay } from "./components/ConsentOverlay";
import { TutorialIntroOverlay } from "./components/TutorialIntroOverlay";
import { TutorialCompleteOverlay } from "./components/TutorialCompleteOverlay";
import { TaskMenu } from "./components/TaskMenu";

import { RewardScreen } from "./components/RewardScreen";
import { PreSurveyOverlay } from "./components/PreSurveyOverlay";
import { NextTaskOverlay } from "./components/NextTaskOverlay";
import { TaskSurveyOverlay } from "./components/TaskSurveyOverlay";
// ★ 新規追加
import { PostSurveyOverlay } from "./components/PostSurveyOverlay";
import { StartScreen } from "./components/StartScreen";

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
  const [appState, setAppState] = useState<AppState>("ready");
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
  // ★ チュートリアル用イージング選択
  const [tutorialEasing, setTutorialEasing] = useState<EasingFunction>("easeInOutExpo");

  const currentEasing: EasingFunction =
    appState === "tutorial" ? tutorialEasing : (currentTaskWithEasing?.easing || "easeInOutExpo");

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
    () => {
      setFeedback(null);
      setFeedbackType("");
      setAppState("tutorial");
    },
    []
  );
  const handleTutorialCompleteClose = useCallback(
    () => {
      console.log("[App] handleTutorialCompleteClose called");
      setAppState("ready");
    },
    []
  );

  const handleTutorialItemClick = useCallback(
    (itemName: string) => {
      const targetItem = lang === "en" ? "Dome Tent 4-person" : "ドーム型テント 4人用";
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
        // ★ 修正: TaskEndOverlayをスキップして直接Rewardへ
        setAppState("reward");
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
      <AnimatePresence>
        {appState === "consent" && (
          <ConsentOverlay
            key="consent"
            isVisible={true}
            lang={lang}
            onAgree={handleConsentAgree}
            onDisagree={handleConsentDisagree}
            onLanguageChange={setLang}
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
          <StartScreen
            key="start-screen"
            isVisible={true}
            lang={lang}
            participantId={participantId}
            isExperimentActive={experimentTasks.length > 0}
            onStart={() => setShowStartConfirm(true)}
            onTutorial={handleStartTutorial}
          />
        )}
      </AnimatePresence>

      {/* ★ 実験開始確認モーダル */}
      <AnimatePresence>
        {showStartConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center mx-4"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {lang === "ja" ? "確認" : "Confirmation"}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {lang === "ja"
                  ? "実験を開始しますか？"
                  : "Are you sure you want to start?"}
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartTask}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:bg-red-600 transition"
                >
                  {lang === "ja" ? "開始する" : "Yes, Start"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStartConfirm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  {lang === "ja" ? "キャンセル" : "Cancel"}
                </motion.button>

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
            <header className="bg-white border-b border-gray-300 py-3 px-6 sticky top-0 z-20 shadow-sm">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Left: Participant Info */}
                <div className="flex items-center gap-4">
                  <div className="text-sm font-semibold text-gray-700">
                    {lang === "ja" ? "実験ID" : "Participant ID"}:
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded font-mono text-sm text-gray-800">
                    {participantId}
                  </div>
                </div>

                {/* Right: Easing Selector */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-gray-700">
                    {lang === "ja" ? "イージング関数" : "Easing Function"}:
                  </label>
                  <select
                    value={currentEasing}
                    onChange={(e) => {
                      if (appState === "tutorial") {
                        setTutorialEasing(e.target.value as EasingFunction);
                      } else if (appState === "task" || appState === "seq" || appState === "next-task-ready") {
                        if (currentTaskWithEasing) {
                          setCurrentTaskWithEasing({
                            ...currentTaskWithEasing,
                            easing: e.target.value as EasingFunction
                          });
                        }
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg font-bold text-base border-2 border-gray-400 bg-white text-gray-800 cursor-pointer hover:border-blue-500 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                  >
                    <option value="linear">linear</option>
                    <option value="easeInOutQuad">easeInOutQuad</option>
                    <option value="easeInOutQuint">easeInOutQuint</option>
                    <option value="easeInOutExpo">easeInOutExpo</option>
                    <option value="easeInOutBack">easeInOutBack</option>
                  </select>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl border-2 border-blue-200 p-8 mb-12 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full -ml-12 -mb-12 opacity-50"></div>

                  <div className="text-center relative z-10">
                    <div className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 shadow-md">
                      {appState === "tutorial"
                        ? (lang === "ja" ? "🎯 チュートリアルタスク" : "🎯 Tutorial Task")
                        : (lang === "ja" ? "🔬 実験タスク進行中" : "🔬 Experiment Task In Progress")}
                    </div>
                    <div className="text-sm font-semibold text-blue-700 uppercase mb-3">
                      {lang === "ja" ? "目標アイテム" : "Target Item"}
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                      {appState !== "tutorial" && currentTaskWithEasing
                        ? currentTaskWithEasing.task.description
                        : lang === "en"
                          ? "Find 'Dome Tent 4-person'"
                          : "「ドーム型テント 4人用」を探してクリックしてください"}
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
