import { motion } from "framer-motion";
import { useMemo } from "react";
import type { TaskLog, EasingFunction } from "../experiment";
import { t } from "../utils/i18n";
import type { Lang } from "../utils/i18n";

interface RewardScreenProps {
  allLogs: TaskLog[];
  lang: Lang;
  participantId: string;
  onContinue: () => void;
}

export function RewardScreen({
  allLogs,
  lang,
  participantId,
  onContinue,
}: RewardScreenProps) {
  // 統計データの計算ロジック
  const stats = useMemo(() => {
    const totalTasks = allLogs.length;
    const correctTasks = allLogs.filter(
      (log) => !log.timedOut && (log.errorCount ?? log.errorClicks ?? 0) === 0
    ).length;
    const accuracy = totalTasks
      ? ((correctTasks / totalTasks) * 100).toFixed(1) + "%"
      : "0%";
    const totalTime = allLogs.reduce((sum, log) => {
      const time = log.totalTime
        ? parseFloat(log.totalTime)
        : log.totalDuration
        ? log.totalDuration / 1000
        : 0;
      return sum + time;
    }, 0);
    const averageTime = totalTasks
      ? (totalTime / totalTasks).toFixed(2) + "s"
      : "0.00s";

    const easingStats: Record<
      EasingFunction,
      { total: number; correct: number; totalTime: number }
    > = {} as Record<
      EasingFunction,
      { total: number; correct: number; totalTime: number }
    >;

    allLogs.forEach((log) => {
      const easing = (log.usedEasing ?? log.easingFunction) as EasingFunction;
      if (!easing) return;
      if (!easingStats[easing]) {
        easingStats[easing] = { total: 0, correct: 0, totalTime: 0 };
      }
      easingStats[easing].total++;
      if (!log.timedOut && (log.errorCount ?? log.errorClicks ?? 0) === 0) {
        easingStats[easing].correct++;
      }
      const time = log.totalTime
        ? parseFloat(log.totalTime)
        : log.totalDuration
        ? log.totalDuration / 1000
        : 0;
      easingStats[easing].totalTime += time;
    });

    let bestEasing: EasingFunction | null = null;
    let bestScore = -1;
    Object.entries(easingStats).forEach(([easing, stat]) => {
      const rate = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
      const avgT = stat.total > 0 ? stat.totalTime / stat.total : 999;
      const score = rate - avgT * 2;
      if (score > bestScore) {
        bestScore = score;
        bestEasing = easing as EasingFunction;
      }
    });

    const validLogs = allLogs.filter(
      (log) => !log.timedOut && (log.errorCount ?? log.errorClicks ?? 0) === 0
    );
    let fastestTime = Infinity;
    validLogs.forEach((log) => {
      const time = log.totalTime
        ? parseFloat(log.totalTime)
        : log.totalDuration
        ? log.totalDuration / 1000
        : 0;
      if (time < fastestTime) {
        fastestTime = time;
      }
    });
    const fastestTaskTime =
      fastestTime !== Infinity ? fastestTime.toFixed(2) + "s" : "-";
    const totalClicks = allLogs.reduce(
      (sum, log) => sum + ((log.clicks?.length ?? log.totalClicks) || 0),
      0
    );
    const totalDistance = allLogs.reduce(
      (sum, log) => sum + (log.menuTravelDistance || 0),
      0
    );
    return {
      accuracy,
      averageTime,
      easingStats,
      bestEasing,
      fastestTaskTime,
      totalClicks,
      totalDistance,
      correctTasks,
      totalTasks,
    };
  }, [allLogs]);

  return (
    <div className="min-h-screen pb-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Hero Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1],
            }}
            transition={{ duration: 1 }}
            className="text-8xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="text-5xl font-black text-gray-800 drop-shadow-sm mb-4">
            {t(lang, "taskCompleted")}
          </h2>
          <div className="inline-block bg-white/90 backdrop-blur text-gray-600 font-mono font-bold px-6 py-2 rounded-full shadow-lg mb-4">
            ID: {participantId}
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.6 }}
            className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full mx-auto max-w-md"
          />
        </motion.div>

        {/* Action Buttons (Moved to Top) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="px-16 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full font-black text-2xl shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center gap-4"
          >
            <span>📋</span>
            {lang === "ja" ? "アンケートへ進む" : "Proceed to Survey"}
            <span>➜</span>
          </motion.button>
        </motion.div>

        {/* Score Card（max-w-4xlを統一） */}
        <motion.div className="glass-effect rounded-3xl p-8 mb-8 shadow-2xl bg-white/60 backdrop-blur-md max-w-4xl mx-auto w-full">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl w-full"
            >
              <div className="text-sm font-semibold opacity-90 mb-2">
                {t(lang, "totalAccuracy")}
              </div>
              <div className="text-5xl font-black">{stats.accuracy}</div>
              <div className="text-sm mt-2 opacity-80">
                {stats.correctTasks}/{stats.totalTasks}{" "}
                {t(lang, "tasksCompletedSuffix")}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-6 text-white shadow-xl w-full"
            >
              <div className="text-sm font-semibold opacity-90 mb-2">
                {t(lang, "avgTime")}
              </div>
              <div className="text-5xl font-black">{stats.averageTime}</div>
              <div className="text-sm mt-2 opacity-80">
                ⚡ {t(lang, "fastestLabel")}: {stats.fastestTaskTime}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-6 text-white shadow-xl w-full"
            >
              <div className="text-sm font-semibold opacity-90 mb-2">
                {t(lang, "totalClicks")}
              </div>
              <div className="text-5xl font-black">{stats.totalClicks}</div>
              <div className="text-sm mt-2 opacity-80">
                📍 {t(lang, "distanceLabel")}: {stats.totalDistance}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* MVP Easing（max-w-4xlを統一） */}
        <motion.div className="glass-effect rounded-3xl p-6 mb-8 shadow-xl text-center bg-white/60 backdrop-blur-md max-w-4xl mx-auto w-full">
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="flex items-center text-3xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              <span className="text-2xl mr-2">🏅</span>
              {t(lang, "mvpEasing")}
            </h3>
          </div>
          <div className="text-5xl font-black text-gray-800 drop-shadow-sm">
            {stats.bestEasing || "-"}
          </div>
          <p className="text-gray-500 mt-2 text-sm">
            {t(lang, "mvpEasingDesc")}
          </p>
        </motion.div>

        {/* Easing Stats Table（max-w-4xlを統一） */}
        <motion.div className="glass-effect rounded-3xl p-6 mb-8 shadow-xl overflow-hidden bg-white/80 backdrop-blur-md max-w-4xl mx-auto w-full">
          <div className="flex justify-center items-center mb-6">
            <span className="text-3xl mr-2">📊</span>
            <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t(lang, "easingPerfTitle")}
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-200">
                  <th className="px-6 py-4 text-left font-bold text-gray-700">
                    {t(lang, "headerEasing")}
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">
                    {t(lang, "headerAccuracy")}
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">
                    {t(lang, "headerAvgTime")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.easingStats).map(
                  ([easing, stat], index) => {
                    const accuracy =
                      stat.total > 0
                        ? ((stat.correct / stat.total) * 100).toFixed(1)
                        : "0.0";
                    const avgTime =
                      stat.total > 0
                        ? (stat.totalTime / stat.total).toFixed(2)
                        : "0.00";
                    const isBest = easing === stats.bestEasing;

                    return (
                      <motion.tr
                        key={easing}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        whileHover={{
                          scale: 1.01,
                          backgroundColor: "rgba(147, 51, 234, 0.05)",
                        }}
                        className={`border-b border-purple-50 transition-all ${
                          isBest
                            ? "bg-gradient-to-r from-yellow-50 to-orange-50"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {isBest && <span className="mr-2">🏆</span>}
                          <span className={isBest ? "text-orange-600" : ""}>
                            {easing}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-4 py-2 rounded-full font-bold ${
                              parseFloat(accuracy) >= 80
                                ? "bg-green-100 text-green-700"
                                : parseFloat(accuracy) >= 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {accuracy}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-700">
                          {avgTime}s
                        </td>
                      </motion.tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Confetti Effect（他は省略/画像パーツだけ） */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: -1 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10%",
              }}
              animate={{
                y: ["0vh", "120vh"],
                rotate: [0, 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {["🎉", "🎊", "⭐", "✨", "🏆"][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
