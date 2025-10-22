const SUPPORTED = ['ja', 'en'] as const;
export type Lang = typeof SUPPORTED[number];

export function detectLang(): Lang {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  
  if (lang === 'ja' || lang === 'en') {
    document.documentElement.lang = lang;
    return lang;
  }
  
  const browserLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
  document.documentElement.lang = browserLang;
  return browserLang;
}

export const TEXT = {
  ja: {
    experimentTitle: "イージング関数における効果測定実験",
    consentTitle: "実験へのご協力に関する同意",
    consentText: "本実験では操作ログ等を記録します。データは匿名化され、研究以外に利用しません。<br />同意いただけたら「同意する」をクリックし、F11キーで全画面表示してください。",
    agree: "同意する",
    disagree: "同意しない",
    startTask: "タスク開始",
    startTutorial: "チュートリアル開始",
    tutorialInfo: (item: string) => `【チュートリアル】「${item}」をメニューから見つけて、クリックしてください。`,
    tutorialWrong: "チュートリアル：違う項目です。",
    tutorialTimeout: "（チュートリアル：時間切れです もう一度トライ可能）",
    tutorialCorrect: "チュートリアル：正解です！",
    taskInfo: (idx: number, max: number, item: string) => `タスク ${idx}/${max}： 「${item}」をメニューから見つけて、クリックしてください。`,
    wrong: "間違いです。もう一度試してください。",
    correct: "正解です！",
    timeout: "時間切れです。",
    continue: "次のタスクへ",
    toResult: "結果へ進む",
    surveyAlert: "タスクアンケートの全ての項目に回答してください。",
    disagreeAlert: "同意いただけない場合は実験に参加できません。",
    startTaskConfirm: "タスクを開始しますか？ 制限時間は1タスク当たり15秒です",
    nextConfirm: "次のタスクに進みますか？",
    toResultConfirm: "結果に進みますか？",
    tutorialStartConfirm: "チュートリアルを開始しますか？",
    tutorialCompleted: "チュートリアル完了",
    tutorialCompletedText: "チュートリアルは以上です。<br />タスク開始ボタンを押す前にメニューの内容を確認しておいてください。",
    closeTutorial: "閉じる",
    tutorialIntroText: "メニューを開くたびにマウスでクリックして選択してください。<br /><br />下のボタンで開始してください。<br /><br />制限時間は1タスク当たり15秒です。",
    tutorialIntroClose: "閉じる",
    surveyTitle: "タスクについてのアンケート",
    surveyQ1: "Q1. メニューの開閉アニメーションは滑らかに感じましたか？",
    surveyQ2: "Q2. メニューの動きは自然に感じましたか？",
    surveyQ3: "Q3. アニメーションの違いが操作のしやすさに影響しましたか？",
    surveyScale1: "1(全くそう思わない) ～ 5(とてもそう思う)",
    surveyScale2: "1(全くそう思わない) ～ 5(とてもそう思う)",
    surveyScale3: "1(全く感じなかった) ～ 5(とても感じた)",
    surveyComments: "コメントがあればご記入ください：",
    taskCompleted: "タスクが完了しました！",
    mvpEasing: "🏅 MVPイージング関数: ",
    totalAccuracy: "全体正解率",
    avgTime: "平均時間",
    fastestTask: "最速タスク",
    totalClicks: "総クリック数",
    totalDistance: "メニュー移動距離",
    avgFirstClick: "初回クリック平均",
    toSurvey: "アンケートへ進む",
  },
  en: {
    experimentTitle: "Easing Function Effectiveness Experiment",
    consentTitle: "Consent for Participation in Experiment",
    consentText: "This experiment records operation logs. Data will be anonymized and used only for research purposes.<br />If you agree, click 'Agree' and press F11 for full screen.",
    agree: "Agree",
    disagree: "Disagree",
    startTask: "Start Task",
    startTutorial: "Start Tutorial",
    tutorialInfo: (item: string) => `[Tutorial] Please find "${item}" from the menu and click it.`,
    tutorialWrong: "Tutorial: Incorrect item.",
    tutorialTimeout: "(Tutorial: Time out. Please try again.)",
    tutorialCorrect: "Tutorial: Correct!",
    taskInfo: (idx: number, max: number, item: string) => `Task ${idx}/${max}: Find "${item}" from the menu and click it.`,
    wrong: "Incorrect. Please try again.",
    correct: "Correct!",
    timeout: "Time out.",
    continue: "Next Task",
    toResult: "Go to Results",
    surveyAlert: "Please answer all items in the task survey.",
    disagreeAlert: "You cannot participate in the experiment if you do not agree.",
    startTaskConfirm: "Start the task? The time limit is 15 seconds per task.",
    nextConfirm: "Proceed to the next task?",
    toResultConfirm: "Go to results?",
    tutorialStartConfirm: "Start the tutorial?",
    tutorialCompleted: "Tutorial Completed",
    tutorialCompletedText: "The tutorial is complete.<br />Please check the menu contents before pressing the task start button.",
    closeTutorial: "Close",
    tutorialIntroText: "Click with the mouse to select each time you open a menu.<br /><br />Start with the button below.<br /><br />The time limit is 15 seconds per task.",
    tutorialIntroClose: "Close",
    surveyTitle: "Task Survey",
    surveyQ1: "Q1. Did the menu open/close animation feel smooth?",
    surveyQ2: "Q2. Did the menu movement feel natural?",
    surveyQ3: "Q3. Did the animation differences affect ease of operation?",
    surveyScale1: "1(Strongly disagree) ～ 5(Strongly agree)",
    surveyScale2: "1(Strongly disagree) ～ 5(Strongly agree)",
    surveyScale3: "1(Not at all) ～ 5(Very much)",
    surveyComments: "Please enter any comments:",
    taskCompleted: "Task Completed!",
    mvpEasing: "🏅 MVP Easing: ",
    totalAccuracy: "Total Accuracy",
    avgTime: "Avg. Time",
    fastestTask: "Fastest Task",
    totalClicks: "Total Clicks",
    totalDistance: "Menu Travel",
    avgFirstClick: "Avg. First Click",
    toSurvey: "Go to Survey",
  }
} as const;

type TextKey = keyof typeof TEXT['ja'];
type TextValue = typeof TEXT['ja'][TextKey];

export function t(lang: Lang, key: TextKey, ...args: any[]): string {
  const val = TEXT[lang][key] as TextValue;
  return typeof val === 'function' ? (val as (...args: any[]) => string)(...args) : val;
}
