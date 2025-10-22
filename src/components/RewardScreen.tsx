import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { TaskLog, EasingFunction } from '../types/experiment';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';
interface RewardScreenProps {
  allLogs: TaskLog[];
  lang: Lang;
  onContinue: () => void;
}

export function RewardScreen({ allLogs, lang, onContinue }: RewardScreenProps) {
  const stats = useMemo(() => {
    const totalTasks = allLogs.length;
    const correctTasks = allLogs.filter(log => !log.timedOut && log.errorCount === 0).length;
    const accuracy = totalTasks ? ((correctTasks / totalTasks) * 100).toFixed(1) + '%' : '0%';
    const totalTime = allLogs.reduce((sum, log) => sum + parseFloat(log.totalTime), 0);
    const averageTime = totalTasks ? (totalTime / totalTasks).toFixed(2) + 's' : '0.00s';

    // Easing statistics
    const easingStats: Record<EasingFunction, { total: number; correct: number; totalTime: number }> = {} as any;
    
    allLogs.forEach(log => {
      const easing = log.usedEasing;
      if (!easingStats[easing]) {
        easingStats[easing] = { total: 0, correct: 0, totalTime: 0 };
      }
      easingStats[easing].total++;
      if (!log.timedOut && log.errorCount === 0) {
        easingStats[easing].correct++;
      }
      easingStats[easing].totalTime += parseFloat(log.totalTime);
    });

    // Find MVP easing
    let bestEasing: EasingFunction | null = null;
    let bestScore = -1;
    Object.entries(easingStats).forEach(([easing, stat]) => {
      const score = stat.total > 0 ? (stat.correct / stat.total * 100) : 0;
      if (score > bestScore) {
        bestScore = score;
        bestEasing = easing as EasingFunction;
      }
    });

    // Fastest task
    const validLogs = allLogs.filter(log => !log.timedOut && log.errorCount === 0);
    let fastestTime = Infinity;
    validLogs.forEach(log => {
      const time = parseFloat(log.totalTime);
      if (time < fastestTime) {
        fastestTime = time;
      }
    });
    const fastestTaskTime = fastestTime !== Infinity ? fastestTime.toFixed(2) + 's' : '-';

    // Total clicks
    const totalClicks = allLogs.reduce((sum, log) => sum + (log.clicks?.length || 0), 0);

    // Total distance
    const totalDistance = allLogs.reduce((sum, log) => sum + (log.menuTravelDistance || 0), 0);

    // Average first click
    const validFirstClicks = allLogs
      .map(log => log.firstClickTime)
      .filter((val): val is number => typeof val === 'number' && !isNaN(val) && val < 100);  // 型ガード追加
    
    const avgFirstClick = validFirstClicks.length
      ? (validFirstClicks.reduce((sum, val) => sum + val, 0) / validFirstClicks.length).toFixed(2) + 's'
      : '-';

    return {
      accuracy,
      averageTime,
      easingStats,
      bestEasing,
      fastestTaskTime,
      totalClicks,
      totalDistance,
      avgFirstClick,
    };
  }, [allLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8 text-center"
    >
      <h2 className="text-3xl font-bold mb-6">{t(lang, 'taskCompleted')}</h2>

      <p className="text-xl font-bold text-orange-600 mb-4">
        {t(lang, 'mvpEasing')}
        <span className="text-2xl">{stats.bestEasing || '-'}</span>
      </p>

      {/* Easing Stats Table */}
      <div className="mb-8 overflow-x-auto">
        <table className="mx-auto border-collapse min-w-[300px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">
                {lang === 'ja' ? 'イージング' : 'Easing'}
              </th>
              <th className="border border-gray-300 px-4 py-2">
                {lang === 'ja' ? '正解率' : 'Accuracy'}
              </th>
              <th className="border border-gray-300 px-4 py-2">
                {lang === 'ja' ? '平均時間' : 'Avg. Time'}
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.easingStats).map(([easing, stat]) => {
              const accuracy = stat.total > 0 ? (stat.correct / stat.total * 100).toFixed(1) : '0.0';
              const avgTime = stat.total > 0 ? (stat.totalTime / stat.total).toFixed(2) : '0.00';
              return (
                <tr key={easing}>
                  <td className="border border-gray-300 px-4 py-2">{easing}</td>
                  <td className="border border-gray-300 px-4 py-2">{accuracy}%</td>
                  <td className="border border-gray-300 px-4 py-2">{avgTime}s</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overall Stats Table */}
      <table className="mx-auto border-collapse min-w-[320px] mb-8">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-blue-600 text-white px-4 py-2">
              {lang === 'ja' ? '項目' : 'Item'}
            </th>
            <th className="border border-gray-300 bg-blue-600 text-white px-4 py-2">
              {lang === 'ja' ? '値' : 'Value'}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="even:bg-gray-50 hover:bg-blue-100">
            <td className="border border-gray-300 px-4 py-2">{t(lang, 'totalAccuracy')}</td>
            <td className="border border-gray-300 px-4 py-2">{stats.accuracy}</td>
          </tr>
          <tr className="even:bg-gray-50 hover:bg-blue-100">
            <td className="border border-gray-300 px-4 py-2">{t(lang, 'avgTime')}</td>
            <td className="border border-gray-300 px-4 py-2">{stats.averageTime}</td>
          </tr>
          <tr className="even:bg-gray-50 hover:bg-blue-100">
            <td className="border border-gray-300 px-4 py-2">{t(lang, 'fastestTask')}</td>
            <td className="border border-gray-300 px-4 py-2">{stats.fastestTaskTime}</td>
          </tr>
          <tr className="even:bg-gray-50 hover:bg-blue-100">
            <td className="border border-gray-300 px-4 py-2">{t(lang, 'totalClicks')}</td>
            <td className="border border-gray-300 px-4 py-2">{stats.totalClicks}</td>
          </tr>
          <tr className="even:bg-gray-50 hover:bg-blue-100">
            <td className="border border-gray-300 px-4 py-2">{t(lang, 'totalDistance')}</td>
            <td className="border border-gray-300 px-4 py-2">{stats.totalDistance}</td>
          </tr>
          <tr className="even:bg-gray-50 hover:bg-blue-100">
            <td className="border border-gray-300 px-4 py-2">{t(lang, 'avgFirstClick')}</td>
            <td className="border border-gray-300 px-4 py-2">{stats.avgFirstClick}</td>
          </tr>
        </tbody>
      </table>

      <button
        onClick={onContinue}
        className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition-all"
      >
        {t(lang, 'toSurvey')}
      </button>
    </motion.div>
  );
}
