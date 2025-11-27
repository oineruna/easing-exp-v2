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
import {
  FrameRateMonitor,
  // getClientIP,
  // getPublicIP,
  getUserAgent,
  getScreenInfo,
} from "./utils/systemInfo";

// アプリケーションの状態定義
type AppState =
  | "consent"           // 同意画面
  | "pre-survey"        // 事前アンケート
  | "ready"             // 開始待機画面
  | "tutorial-intro"    // チュートリアル説明
  | "tutorial"          // チュートリアル実行中
  | "tutorial-complete" // チュートリアル完了
  | "task"              // 本番タスク実行中
  | "seq"               // タスク間アンケート（NASA-TLX簡易版）
  | "next-task-ready"   // 次のタスクへの準備画面
  | "reward"            // 全タスク完了・結果表示
  | "post-survey";      // 事後アンケート

// イージング情報付きタスク型
interface TaskWithEasing {
  trial: number;
  task: Task;
  easing: EasingFunction;
}

// 文字列からハッシュ値を生成する関数（シード生成用）
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * メインアプリケーションコンポーネント
 * 実験全体のフロー制御、状態管理、データ収集を担当します
 */
export default function App() {
  // --- State Definitions ---
  const [lang, setLang] = useState<Lang>("ja");
  const [appState, setAppState] = useState<AppState>("consent"); // 初期状態は同意画面
  const [participantId, setParticipantId] = useState<string>("");

  // メニューデータ
  const [menuCategories, setMenuCategories] = useState<Category[]>([]);
  const [tutorialCategories, setTutorialCategories] = useState<Category[]>([]);

  // タスク管理
  const [experimentTasks, setExperimentTasks] = useState<TaskWithEasing[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentTaskWithEasing, setCurrentTaskWithEasing] =
    useState<TaskWithEasing | null>(null);

  // データログ
  const [allLogs, setAllLogs] = useState<TaskLog[]>([]);
  const [preSurveyData, setPreSurveyData] = useState<PreSurveyData | null>(
    null
  );
  const [tempTaskLog, setTempTaskLog] = useState<TaskLog | null>(null);

  // UIフィードバック
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "incorrect" | "timeout" | ""
  >("");

  // 実験開始確認用ステート
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  // チュートリアル用イージング選択
  const [tutorialEasing, setTutorialEasing] = useState<EasingFunction>("easeInOutExpo");

  // 現在適用中のイージング関数
  const currentEasing: EasingFunction =
    appState === "tutorial" ? tutorialEasing : (currentTaskWithEasing?.easing || "easeInOutExpo");

  // Refs
  const timeoutIdRef = useRef<number | null>(null);
  const taskLogger = useTaskLogger();

  // システム情報収集用
  const fpsMonitorRef = useRef<FrameRateMonitor | null>(null);
  const [systemInfo, setSystemInfo] = useState<{
    // clientIP: string;
    // publicIP: string;
    userAgent: string;
    screenInfo: ReturnType<typeof getScreenInfo>;
  } | null>(null);

  // --- Effects ---

  // 初期化 & localStorage復元確認
  useEffect(() => {
    setLang(detectLang());
    const url = new URL(window.location.href);
    const params = url.searchParams;
    let id = params.get("pid") || params.get("id");

    // IDがない場合はランダム生成
    if (!id) {
      id = Math.floor(1000 + Math.random() * 9000).toString();
    }

    setParticipantId(id);
    params.set("pid", id);
    window.history.replaceState(null, "", url.toString());

    // localStorage からバックアップを確認して復元
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

  // メニューデータの読み込み
  useEffect(() => {
    const loadData = async () => {
      const mainCats = await loadMenuCategories(lang);
      setMenuCategories(mainCats);
      const tutCats = await loadTutorialCategories(lang);
      setTutorialCategories(tutCats);
    };
    loadData();
  }, [lang]);

  // システム情報を収集
  useEffect(() => {
    // FPSモニターを初期化
    if (!fpsMonitorRef.current) {
      fpsMonitorRef.current = new FrameRateMonitor();
    }

    // ユーザーエージェント、画面情報を取得
    const collectSystemInfo = async () => {
      setSystemInfo({
        userAgent: getUserAgent(),
        screenInfo: getScreenInfo(),
      });

      console.log("[System Info] Collected:", {
        userAgent: getUserAgent(),
        screenInfo: getScreenInfo(),
      });
    };

    collectSystemInfo();

    // クリーンアップ
    return () => {
      if (fpsMonitorRef.current) {
        fpsMonitorRef.current.stop();
      }
    };
  }, []);


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

  // --- Event Handlers ---

  // 同意画面
  const handleConsentAgree = useCallback(() => setAppState("pre-survey"), []);
  const handleConsentDisagree = useCallback(
    () => alert(t(lang, "disagreeAlert")),
    [lang]
  );

  // 事前アンケート完了
  const handlePreSurveyComplete = useCallback((data: PreSurveyData) => {
    console.log("[Pre-Survey]", data);
    setPreSurveyData(data);
    setAppState("ready");
  }, []);

  // チュートリアル関連
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
      setFeedback(null);
      setFeedbackType("");
      setAppState("ready");
    },
    []
  );

  // チュートリアル中のアイテムクリック処理
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

  // タスクタイムアウト処理
  const handleTaskTimeout = useCallback(() => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

    setFeedback(lang === "en" ? "Timeout!" : "タイムアウト!");
    setFeedbackType("timeout");

    // FPSモニターを停止してFPS統計を取得
    let fpsStats = undefined;
    if (fpsMonitorRef.current) {
      fpsStats = fpsMonitorRef.current.getStats();
      fpsMonitorRef.current.stop();
      console.log("[FPS] Task timeout - Stats:", fpsStats);
    }

    const log = taskLogger.stopTask(false, true);
    if (currentTaskWithEasing) {
      const fullLog = {
        ...log,
        trialNumber: currentTaskWithEasing.trial,
        taskId: currentTaskWithEasing.task.id,
        targetItem: currentTaskWithEasing.task.targetPath.join(" > "),
        easingFunction: currentTaskWithEasing.easing,
        fps: fpsStats ? {
          average: fpsStats.average,
          min: fpsStats.min,
          max: fpsStats.max,
        } : undefined,
      } as TaskLog;
      setTempTaskLog(fullLog);
    }

    setTimeout(() => {
      setFeedback(null);
      setFeedbackType("");
      setAppState("seq");
    }, 200);
  }, [currentTaskWithEasing, taskLogger, lang, participantId]);


  // 実験タスク開始処理
  const handleStartTask = useCallback(async () => {
    // 確認ダイアログを閉じる
    setShowStartConfirm(false);

    if (menuCategories.length === 0) return;

    // タスクシーケンス生成（ラテン方格法を使用）
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

    // FPSモニタリングを開始
    if (fpsMonitorRef.current) {
      fpsMonitorRef.current.reset();
      fpsMonitorRef.current.start();
      console.log("[FPS] Monitoring started for task");
    }

    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(
      () => handleTaskTimeout(),
      TIME_LIMIT_MS
    );
  }, [menuCategories, lang, participantId, taskLogger, handleTaskTimeout]);


  // タスク中のアイテムクリック処理
  const handleTaskItemClick = useCallback(
    (itemName: string, isCorrectPath: boolean) => {
      if (!currentTaskWithEasing) return;
      taskLogger.recordClick(itemName, menuCategories);

      const targetItem =
        currentTaskWithEasing.task.targetPath[
        currentTaskWithEasing.task.targetPath.length - 1
        ];

      if (itemName === targetItem) {
        // 正解の場合
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

        setFeedback(lang === "en" ? "Correct!" : "正解!");
        setFeedbackType("correct");

        // FPSモニターを停止してFPS統計を取得
        let fpsStats = undefined;
        if (fpsMonitorRef.current) {
          fpsStats = fpsMonitorRef.current.getStats();
          fpsMonitorRef.current.stop();
          console.log("[FPS] Task completed - Stats:", fpsStats);
        }

        const log = taskLogger.stopTask(true, false);
        const fullLog = {
          ...log,
          trialNumber: currentTaskWithEasing.trial,
          taskId: currentTaskWithEasing.task.id,
          targetItem: currentTaskWithEasing.task.targetPath.join(" > "),
          easingFunction: currentTaskWithEasing.easing,
          fps: fpsStats ? {
            average: fpsStats.average,
            min: fpsStats.min,
            max: fpsStats.max,
          } : undefined,
        } as TaskLog;

        setTempTaskLog(fullLog);

        setTimeout(() => {
          setFeedback(null);
          setFeedbackType("");
          setAppState("seq");
        }, 200);
      } else if (!isCorrectPath) {
        // 不正解（間違ったパス）の場合
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

  // タスク後アンケート完了処理
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
        // 全タスク終了時
        setAppState("reward");
      }
    },
    [currentTaskIndex, experimentTasks.length, tempTaskLog]
  );

  // 次のタスクへ進む処理
  const handleNextTaskStart = useCallback(() => {
    const nextIndex = currentTaskIndex + 1;
    setCurrentTaskIndex(nextIndex);
    setCurrentTaskWithEasing(experimentTasks[nextIndex]);

    setAppState("task");
    taskLogger.resetTask();

    // FPSモニタリングを再開
    if (fpsMonitorRef.current) {
      fpsMonitorRef.current.reset();
      fpsMonitorRef.current.start();
      console.log("[FPS] Monitoring restarted for next task");
    }

    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = window.setTimeout(
      () => handleTaskTimeout(),
      TIME_LIMIT_MS
    );
  }, [currentTaskIndex, experimentTasks, taskLogger, handleTaskTimeout]);


  // 事後アンケート完了＆データ保存処理
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
        systemInfo: systemInfo || undefined,
      };


      // サーバーへ送信
      try {
        fetch("/api/submit-experiment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalData),
        })
          .then((res) => {
            if (res.ok) {
              alert(
                lang === "ja"
                  ? "実験データが正常に送信されました。\nご協力ありがとうございました。"
                  : "Experiment data submitted successfully.\nThank you for your cooperation."
              );
            } else {
              throw new Error("Server error");
            }
          })
          .catch((err) => {
            console.error("Submission error:", err);
            alert(
              lang === "ja"
                ? "データの自動送信に失敗しました。\nダウンロードされるJSONファイルを実験担当者に送付してください。"
                : "Failed to submit data automatically.\nPlease send the downloaded JSON file to the experimenter."
            );
          })
          .finally(() => {
            // バックアップとして必ずJSONダウンロードを実行
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

            // データをクリアして終了状態へ
            localStorage.removeItem(`experiment_backup_${participantId}`);
            setAppState("consent");
          });
      } catch (e) {
        console.error("Error in submission flow:", e);
      }
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
          // 事後アンケート(post-survey)へ遷移
          onContinue={() => setAppState("post-survey")}
        />
      )}

      {/* 事後アンケートオーバーレイ */}
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

      {/* 実験開始確認モーダル */}
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
              <div className="flex gap-2 justify-center">
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

      {/* メイン画面（ヘッダーとタスクエリア） */}
      {(appState === "tutorial" ||
        appState === "task" ||
        appState === "seq" ||
        appState === "next-task-ready") && (
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-300 py-3 px-6 sticky top-0 z-20 shadow-sm">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* 左側: 参加者情報 */}
                <div className="flex items-center gap-4">
                  <div className="text-sm font-semibold text-gray-700">
                    {lang === "ja" ? "実験ID" : "Participant ID"}:
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded font-mono text-sm text-gray-800">
                    {participantId}
                  </div>
                </div>

                {/* 右側: イージング選択（デバッグ/チュートリアル用） */}
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
              <div className="py-6">
                {/* タスク指示バー */}
                <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-3 mb-6 ml-108 w-192">
                  <div className="flex items-center gap-3">
                    {/* ステータスインジケーター */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-green-50 rounded-full">
                      <motion.div
                        className="w-4 h-4 bg-green-500 rounded-full shadow-lg"
                        animate={{
                          scale: [1, 1.3, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(34, 197, 94, 0.4)",
                            "0 0 0 8px rgba(34, 197, 94, 0)",
                            "0 0 0 0 rgba(34, 197, 94, 0)"
                          ]
                        }}
                        transition={{
                          duration: 1.0,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                      <span className="text-sm font-bold text-green-700">
                        {appState === "tutorial"
                          ? (lang === "ja" ? "チュートリアル中" : "In Tutorial")
                          : (lang === "ja" ? "実験中" : "In Progress")}
                      </span>
                    </div>

                    <div className="w-px h-8 bg-gray-300"></div>

                    {/* タスク内容表示 */}
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 font-medium mb-2 border-b-2 border-dotted border-gray-300 pb-1 inline-block">
                        {lang === "ja" ? "目標アイテム" : "Target Item"}
                        {appState !== "tutorial" && (
                          <span className="ml-2 text-gray-400 font-normal">
                            ({currentTaskIndex + 1}/{experimentTasks.length})
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 leading-tight">
                        {appState !== "tutorial" && currentTaskWithEasing
                          ? lang === "en"
                            ? `Find "${currentTaskWithEasing.task.targetPath[currentTaskWithEasing.task.targetPath.length - 1]}"`
                            : `「${currentTaskWithEasing.task.targetPath[currentTaskWithEasing.task.targetPath.length - 1]}」を探してクリックしてください`
                          : lang === "en"
                            ? "Find 'Dome Tent for 4 People'"
                            : "「ドーム型テント 4人用」を探してクリックしてください"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* フィードバック表示エリア */}
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

                {/* メニューコンポーネント */}
                <div className="relative h-[500px] z-0 -ml-64">
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
