import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { TaskLog, EasingFunction } from '../types/experiment';
import { t } from '../utils/i18n';
import type { Lang } from '../utils/i18n';
import { PreSurveyData } from "../types/PreSurveyData";

interface RewardScreenProps {
  allLogs: TaskLog[];
  lang: Lang;
  preSurveyData: PreSurveyData | null;
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
      .filter((val): val is number => typeof val === 'number' && !isNaN(val) && val < 100);
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
      correctTasks,
      totalTasks,
    };
  }, [allLogs]);

  return (
    <div className="min-h-screen pb-16">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto px-4 pt-8"
      >
        {/* Hero Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-8xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="text-5xl font-black text-white drop-shadow-2xl mb-4">
            {t(lang, 'taskCompleted')}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full mx-auto max-w-md"
          />
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-3xl p-8 mb-8 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              style={{ background: 'var(--gradient-success)' }}
              className="rounded-2xl p-6 text-white shadow-xl">
              <div className="text-sm font-semibold opacity-90 mb-2">{t(lang, 'totalAccuracy')}</div>
              <div className="text-5xl font-black">{stats.accuracy}</div>
              <div className="text-sm mt-2 opacity-80">
                {stats.correctTasks}/{stats.totalTasks} {lang === 'ja' ? 'タスク成功' : 'tasks completed'}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="text-sm font-semibold opacity-90 mb-2">{t(lang, 'avgTime')}</div>
              <div className="text-5xl font-black">{stats.averageTime}</div>
              <div className="text-sm mt-2 opacity-80">
                ⚡ {lang === 'ja' ? '最速' : 'Fastest'}: {stats.fastestTaskTime}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="text-sm font-semibold opacity-90 mb-2">{t(lang, 'totalClicks')}</div>
              <div className="text-5xl font-black">{stats.totalClicks}</div>
              <div className="text-sm mt-2 opacity-80">
                📍 {lang === 'ja' ? '移動距離' : 'Distance'}: {stats.totalDistance}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* MVP Easing */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-effect rounded-3xl p-8 mb-8 shadow-2xl text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block"
          >
            <div className="text-6xl mb-4">🏆</div>
          </motion.div>
          <h3 className="text-3xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            {t(lang, 'mvpEasing')}
          </h3>
          <div className="text-5xl font-black text-white drop-shadow-lg">
            {stats.bestEasing || '-'}
          </div>
        </motion.div>

        {/* Easing Stats Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="glass-effect rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden"
        >
          <h3 className="text-2xl font-black mb-6 text-center gradient-text">
            📊 {lang === 'ja' ? 'イージング関数別パフォーマンス' : 'Performance by Easing Function'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-300">
                  <th className="px-6 py-4 text-left font-bold text-gray-700">
                    {lang === 'ja' ? 'イージング' : 'Easing'}
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">
                    {lang === 'ja' ? '正解率' : 'Accuracy'}
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-gray-700">
                    {lang === 'ja' ? '平均時間' : 'Avg. Time'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.easingStats).map(([easing, stat], index) => {
                  const accuracy = stat.total > 0 ? (stat.correct / stat.total * 100).toFixed(1) : '0.0';
                  const avgTime = stat.total > 0 ? (stat.totalTime / stat.total).toFixed(2) : '0.00';
                  const isBest = easing === stats.bestEasing;

                  return (
                    <motion.tr
                      key={easing}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                      className={`border-b border-purple-100 transition-all ${
                        isBest ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {isBest && <span className="mr-2">🏆</span>}
                        <span className={isBest ? 'text-orange-600' : ''}>{easing}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-4 py-2 rounded-full font-bold ${
                          parseFloat(accuracy) >= 80 ? 'bg-green-100 text-green-700' :
                          parseFloat(accuracy) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {accuracy}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-700">
                        {avgTime}s
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="glass-effect rounded-3xl p-8 mb-8 shadow-2xl"
        >
          <h3 className="text-2xl font-black mb-6 text-center gradient-text">
            📈 {lang === 'ja' ? '詳細統計' : 'Detailed Statistics'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-2xl p-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t(lang, 'fastestTask')}</span>
              <span className="text-2xl font-black text-purple-600">{stats.fastestTaskTime}</span>
            </div>
            <div className="bg-white/60 rounded-2xl p-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t(lang, 'avgFirstClick')}</span>
              <span className="text-2xl font-black text-blue-600">{stats.avgFirstClick}</span>
            </div>
            <div className="bg-white/60 rounded-2xl p-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t(lang, 'totalClicks')}</span>
              <span className="text-2xl font-black text-green-600">{stats.totalClicks}</span>
            </div>
            <div className="bg-white/60 rounded-2xl p-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700">{t(lang, 'totalDistance')}</span>
              <span className="text-2xl font-black text-orange-600">{stats.totalDistance}</span>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: '0 25px 50px rgba(147, 51, 234, 0.5)',
            }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="px-16 py-6 btn-primary text-white rounded-full font-black text-2xl shadow-2xl relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              style={{ opacity: 0.3 }}
            />
            <span className="relative z-10 flex items-center gap-3">
              {t(lang, 'toSurvey')}
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                →
              </motion.span>
            </span>
          </motion.button>
        </motion.div>

        {/* Confetti Effect */}
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
                top: '-10%',
              }}
              animate={{
                y: ['0vh', '120vh'],
                rotate: [0, 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {['🎉', '🎊', '⭐', '✨', '🏆'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
