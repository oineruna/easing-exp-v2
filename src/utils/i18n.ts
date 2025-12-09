// --- START OF FILE src/utils/i18n.ts ---

// サポートされている言語の定義
const SUPPORTED = ["ja", "en"] as const;
export type Lang = (typeof SUPPORTED)[number];

/**
 * ブラウザの言語設定またはURLパラメータから言語を検出します
 * URLパラメータ ?lang=en または ?lang=ja が優先されます
 */
export function detectLang(): Lang {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang");

  if (lang === "ja" || lang === "en") {
    document.documentElement.lang = lang;
    return lang;
  }

  const browserLang = navigator.language.startsWith("ja") ? "ja" : "en";
  document.documentElement.lang = browserLang;
  return browserLang;
}

// アプリケーション全体で使用されるテキストリソース
// 日本語(ja)と英語(en)の辞書オブジェクト
export const TEXT = {
  ja: {
    // --- 共通・実験全体 ---
    experimentTitle: "イージング関数における効果測定実験",
    experimentStart: "実験開始",
    welcomeTitle: "実験へようこそ",
    welcomeSubtitle: "メニュー探索タスクにおける操作性の評価",
    consentTitle: "実験へのご協力に関する同意",
    consentProviso:
      "本システムの使用を開始した時点で、以下の実験内容および条件に同意したものとみなされます。",
    consentText:
      "本実験では操作ログ等を記録します。データは匿名化され、研究以外に利用しません。<br />同意いただけたら「同意する」をクリックし、F11キーで全画面表示してください。",
    consentLinkText: "実験について（詳細）",
    agree: "同意する",
    disagree: "同意しない",
    disagreeAlert: "同意いただけない場合は実験に参加できません。",

    // --- チュートリアル ---
    completionTitle: "実験終了",
    completionMessage: "すべてのタスクとアンケートが完了しました。<br />ご協力ありがとうございました。",
    completionClose: "完了してタブを閉じる",

    startTutorial: "チュートリアル開始",
    tutorialLabel: "チュートリアル",
    tutorialIntroText:
      "メニューを開くたびにマウスでクリックして選択してください。<br /><br />すべてのメニューは４階層まであります。<br /><br /><span class='text-red-600 font-bold'>※ できるだけ早くクリアしてください。</span><br />制限時間は1タスク当たり20秒です。",
    tutorialIntroClose: "チュートリアル開始",
    tutorialInfo: (item: string) =>
      `【チュートリアル】「${item}」をメニューから見つけて、クリックしてください。`,
    tutorialWrong: "チュートリアル：違う項目です。",
    tutorialTimeout: "（チュートリアル：時間切れです もう一度トライ可能）",
    tutorialCorrect: "チュートリアル：正解です！",
    tutorialCompleted: "チュートリアル完了",
    tutorialCompletedText:
      "チュートリアルは以上です。<br />タスク開始ボタンを押す前にメニューの内容を確認しておいてください。",
    closeTutorial: "閉じる",

    // --- 本番タスク ---
    startTask: "タスク開始",
    taskInfo: (idx: number, max: number, item: string) =>
      `タスク ${idx}/${max}： 「${item}」をメニューから見つけて、クリックしてください。`,
    wrong: "間違いです。もう一度試してください。",
    correct: "正解です！",
    timeout: "時間切れです。",

    // --- タスク間遷移 (NextTaskOverlay) ---
    nextTaskTitle: "次のタスクへ進みます",
    nextTaskButton: "次へ",
    nextTaskProgress: (current: number, total: number) =>
      `タスク ${current} / ${total}`,

    // --- タスク毎アンケート (TaskSurveyOverlay) ---
    taskSurveyTitle: (num: number) => `タスク ${num} の評価`,
    taskSurveyQuestion: "このタスクの操作性を評価してください",
    taskSurveyLow: "低",
    taskSurveyHigh: "高",
    taskSurveyQ1: "アニメーションの動きやすさ",
    taskSurveyScale1: "1: 非常に使いにくい - 5: 非常に使いやすい",
    taskSurveyQ2: "タスクの難易度",
    taskSurveyScale2: "1: 非常に難しい - 5: 非常に簡単",
    taskSurveyQ3: "アニメーションの違和感",
    taskSurveyScale3: "1: 違和感がある - 5: 自然である",
    taskSurveyComment: "気になった点があれば教えてください（任意）",
    taskSurveyPlaceholder: "自由記入欄...",
    taskSurveySubmit: "次へ進む",
    surveyAlert: "すべての必須項目に回答してください。",

    // --- 全タスク終了画面 (TaskEndOverlay) ---
    taskEndTitle: "全タスク終了",
    taskEndMessage: "すべてのタスクが終了しました。<br />お疲れ様でした。",
    toResult: "結果へ進む",

    // --- 結果画面 (RewardScreen) ---
    taskCompleted: "タスクが完了しました！",
    totalAccuracy: "全体正解率",
    avgTime: "平均時間",
    totalClicks: "総クリック数",
    tasksCompletedSuffix: "タスク成功",
    fastestLabel: "最速",
    distanceLabel: "移動距離",
    mvpEasing: "MVPイージング関数",
    mvpEasingDesc: "最もパフォーマンスが良かった動き",
    easingPerfTitle: "イージング関数別パフォーマンス",
    headerEasing: "イージング",
    headerAccuracy: "正解率",
    headerAvgTime: "平均時間",
    toPostSurvey: "アンケートへ進む",
    backToTop: "トップへ戻る",
    downloadData: "データを保存",

    // --- 事後アンケート (PostSurveyOverlay) ---
    postSurveyTitle: "事後アンケート",
    postSurveyFatigue: "実験全体の疲労度",
    postSurveyFatigueLow: "低",
    postSurveyFatigueHigh: "高",
    postSurveyPreference: "最も使いやすかったアニメーション",
    postSurveyPrefSmooth: "滑らかな動き",
    postSurveyPrefSnappy: "キビキビした動き",
    postSurveyPrefNone: "特に違いを感じなかった",
    postSurveyComments: "その他コメント（任意）",
    postSurveyCommentsPlaceholder: "自由にご記入ください...",
    postSurveySubmit: "送信",
    postSurveyAlert: "好みを選択してください。",
    postSurveyQ1: "1. 被験者ID",
    postSurveyQ1Note: "※自動入力されています",
    postSurveyQ2:
      "2. 実験全体を通して、メニューアニメーションに違いがあることに気づきましたか？",
    postSurveyQ2Options: ["はい", "いいえ", "よくわからなかった"],
    postSurveyQ3:
      "3. アニメーションがタスクのやりやすさに与えた影響について、当てはまるものをすべて選んでください。",
    postSurveyQ3Options: [
      "操作のスピードが上がった（速く終わるようになった）",
      "操作のスピードが下がった（遅くなった）",
      "どこを操作すればいいか分かりやすくなった",
      "どこを操作すればいいか分かりにくくなった",
      "ストレスが減った",
      "ストレスが増えた",
      "特に変化は感じなかった",
      "その他",
    ],
    postSurveyQ4:
      "4. 最も「使いやすい」と感じたアニメーションの特徴は何ですか？",
    postSurveyQ5:
      "5. 最も「使いにくい・操作しづらい」と感じたアニメーションの特徴は何ですか？",
    postSurveyFeatureOptions: [
      "ゆっくり滑らかに動く",
      "素早く動く",
      "弾むような動き",
      "一定速度で動く",
      "その他",
    ],
    postSurveyQ6:
      "6. アニメーションや操作性について、改善してほしい点や気になったことがあれば教えてください",
    postSurveyNote: "※このボタンを押すと実験データがダウンロードされます",
    dataSavedMsg: "実験データが保存されました。ご協力ありがとうございました。",
    dataSaveFailedMsg:
      "データの自動送信に失敗しました。手動でファイルをダウンロードしますか？\n(ダウンロードしたファイルを実験担当者に送付してください)",

    // PreSurveyOverlay
    preSurveyTitle: "事前アンケート",
    preSurveyIntro:
      "これから5種類のアニメーションをお見せします。各アニメーションを見て、あなたの好みを評価してください。",
    preSurveyNote: "※ この情報は実験データの分析にのみ使用されます",
    preSurveyStart: "開始する",
    preSurveyDemoTitle: "あなたの感覚に最も近い評価を選んでください（不快-快適）",
    preSurveyPreference: "操作感",
    preSurveyLow: "不快",
    preSurveyHigh: "快適",
    preSurveyNext: "次へ",
    preSurveyRankingTitle: "好みの順に並べ替えてください",
    preSurveyRankingDesc:
      "ドラッグ＆ドロップで順位を変更できます(1位が最も好き)",
    preSurveyCommentTitle: "最後に一言(任意)",
    preSurveyCommentPlaceholder:
      "アニメーションの好みについて、何か気づいたことがあれば自由にお書きください...",
    preSurveyComplete: "完了",
    preSurveyAlert: "すべてのアニメーションを評価してください",

    // Easing Labels (JA)
    easingLinearLabel: "一定速度",
    easingLinearDesc: "等速で動く",
    easingQuadLabel: "ゆったり",
    easingQuadDesc: "ゆっくり加速・減速",
    easingQuintLabel: "なめらか",
    easingQuintDesc: "とても滑らか",
    easingExpoLabel: "メリハリ",
    easingExpoDesc: "急加速・急停止",
    easingBackLabel: "弾む",
    easingBackDesc: "オーバーシュート",

    // ConsentOverlay
    langJa: "日本語",
    langEn: "English",
  },
  en: {
    // --- Common ---
    experimentTitle: "Easing Function Effectiveness Experiment",
    experimentStart: "Start Experiment",
    welcomeTitle: "Welcome to the Experiment",
    welcomeSubtitle: "Evaluation of usability in menu selection tasks",
    consentTitle: "Consent for Participation",
    consentProviso:
      "By starting to use this system, you are deemed to have agreed to the following experimental content and conditions.",
    consentText:
      "This experiment records operation logs. Data will be anonymized and used only for research.<br />If you agree, click 'Agree' and press F11 for full screen.",
    consentLinkText: "About Experiment (Details)",
    agree: "Agree",
    disagree: "Disagree",
    disagreeAlert:
      "You cannot participate in the experiment if you do not agree.",

    // --- Tutorial ---
    completionTitle: "Experiment Completed",
    completionMessage: "All tasks and surveys have been completed.<br />Thank you for your cooperation.",
    completionClose: "Complete and Close Tab",

    startTutorial: "Start Tutorial",
    tutorialLabel: "Tutorial",
    tutorialIntroText:
      "Click to select items from the menu.<br /><br />Start with the button below.<br /><br />Time limit: 20s per task.",
    tutorialIntroClose: "Close",
    tutorialInfo: (item: string) => `[Tutorial] Find "${item}" and click it.`,
    tutorialWrong: "Tutorial: Incorrect item.",
    tutorialTimeout: "(Tutorial: Timed out. Try again.)",
    tutorialCorrect: "Tutorial: Correct!",
    tutorialCompleted: "Tutorial Completed",
    tutorialCompletedText:
      "Tutorial complete.<br />Please check the menu structure before starting.",
    closeTutorial: "Close",

    // --- Task ---
    startTask: "Start Task",
    taskInfo: (idx: number, max: number, item: string) =>
      `Task ${idx}/${max}: Find "${item}" and click it.`,
    wrong: "Incorrect. Try again.",
    correct: "Correct!",
    timeout: "Timed out.",

    // --- Next Task ---
    nextTaskTitle: "Proceed to Next Task",
    nextTaskButton: "Next",
    nextTaskProgress: (current: number, total: number) =>
      `Task ${current} / ${total}`,

    // --- Task Survey ---
    taskSurveyTitle: (num: number) => `Task ${num} Evaluation`,
    taskSurveyQuestion: "Please rate the usability of this task",
    taskSurveyLow: "Low",
    taskSurveyHigh: "High",
    taskSurveyQ1: "Animation Ease of Use",
    taskSurveyScale1: "1: Very Difficult - 5: Very Easy",
    taskSurveyQ2: "Task Difficulty",
    taskSurveyScale2: "1: Very Hard - 5: Very Easy",
    taskSurveyQ3: "Animation Naturalness",
    taskSurveyScale3: "1: Unnatural - 5: Natural",
    taskSurveyComment: "Any comments? (Optional)",
    taskSurveyPlaceholder: "Optional...",
    taskSurveySubmit: "Next Task",
    surveyAlert: "Please answer all required items.",

    // --- Task End ---
    taskEndTitle: "All Tasks Completed",
    taskEndMessage:
      "All tasks have been completed.<br />Thank you for your hard work.",
    toResult: "Go to Results",

    // --- Result ---
    taskCompleted: "Task Completed!",
    totalAccuracy: "Total Accuracy",
    avgTime: "Avg. Time",
    totalClicks: "Total Clicks",
    tasksCompletedSuffix: "tasks completed",
    fastestLabel: "Fastest",
    distanceLabel: "Distance",
    mvpEasing: "🏅 MVP Easing",
    mvpEasingDesc: "Best performing animation",
    easingPerfTitle: "Performance by Easing Function",
    headerEasing: "Easing",
    headerAccuracy: "Accuracy",
    headerAvgTime: "Avg. Time",
    toPostSurvey: "Proceed to Survey",
    backToTop: "Back to Top",
    downloadData: "Download Data",

    // --- Post Survey ---
    postSurveyTitle: "Post-Experiment Survey",
    postSurveyFatigue: "Overall fatigue level",
    postSurveyFatigueLow: "Low",
    postSurveyFatigueHigh: "High",
    postSurveyPreference: "Most preferred animation",
    postSurveyPrefSmooth: "Smooth movement",
    postSurveyPrefSnappy: "Snappy movement",
    postSurveyPrefNone: "No particular preference",
    postSurveyComments: "Additional comments (Optional)",
    postSurveyCommentsPlaceholder: "Feel free to share your thoughts...",
    postSurveySubmit: "Submit",
    postSurveyAlert: "Please select your preference.",
    postSurveyQ1: "1. Participant ID",
    postSurveyQ1Note: "* Automatically filled",
    postSurveyQ2:
      "2. Did you notice differences in menu animations throughout the experiment?",
    postSurveyQ2Options: ["Yes", "No", "Not sure"],
    postSurveyQ3:
      "3. How did the animations affect your task performance? (Select all that apply)",
    postSurveyQ3Options: [
      "Increased speed (Finished faster)",
      "Decreased speed (Slower)",
      "Made it easier to know where to click",
      "Made it harder to know where to click",
      "Reduced stress",
      "Increased stress",
      "Felt no particular change",
      "Other",
    ],
    postSurveyQ4: "4. Which animation feature was the EASIEST to use?",
    postSurveyQ5: "5. Which animation feature was the HARDEST to use?",
    postSurveyFeatureOptions: [
      "Slow and smooth movement",
      "Quick movement",
      "Bouncy movement",
      "Constant speed movement",
      "Other",
    ],
    postSurveyQ6: "6. Any feedback on animation or usability?",
    postSurveyNote: "* Data will be downloaded upon clicking",
    dataSavedMsg: "Data saved successfully. Thank you!",
    dataSaveFailedMsg:
      "Automatic upload failed. Do you want to download the file manually?",

    // PreSurveyOverlay
    preSurveyTitle: "Pre-Survey",
    preSurveyIntro:
      "We will show you 5 types of animations. Please rate each animation based on your preference.",
    preSurveyNote: "※ This information will be used for data analysis only",
    preSurveyStart: "Start",
    preSurveyDemoTitle: "Rate Each Animation based on your preference(Unpleasant - Pleasant)",
    preSurveyPreference: "Preference",
    preSurveyLow: "Low",
    preSurveyHigh: "High",
    preSurveyNext: "Next",
    preSurveyRankingTitle: "Rank by Preference",
    preSurveyRankingDesc: "Drag & drop to reorder (1st = most preferred)",
    preSurveyCommentTitle: "Additional Comments (Optional)",
    preSurveyCommentPlaceholder:
      "Feel free to share any thoughts about your animation preferences...",
    preSurveyComplete: "Complete",
    preSurveyAlert: "Please rate all animations",

    // Easing Labels (EN)
    easingLinearLabel: "Linear",
    easingLinearDesc: "Constant speed",
    easingQuadLabel: "Smooth (Weak)",
    easingQuadDesc: "Gentle acceleration",
    easingQuintLabel: "Smooth (Strong)",
    easingQuintDesc: "Very smooth",
    easingExpoLabel: "Snappy",
    easingExpoDesc: "Quick start/stop",
    easingBackLabel: "Bounce",
    easingBackDesc: "Overshoot effect",

    // ConsentOverlay
    langJa: "日本語",
    langEn: "English",
  },
} as const;

export type TextKey = keyof (typeof TEXT)["ja"];

/**
 * 指定された言語とキーに対応する翻訳テキストを取得します
 * 関数型の場合は引数を適用して文字列を生成します
 */
export function t(lang: Lang, key: TextKey, ...args: any[]): any {
  const val = TEXT[lang][key];
  if (typeof val === "function") {
    return (val as (...args: any[]) => string)(...args);
  }
  return val;
}
