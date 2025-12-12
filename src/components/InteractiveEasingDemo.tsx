import { motion } from 'framer-motion';
import type { EasingFunction } from '../experiment';

interface InteractiveEasingDemoProps {
    easing: EasingFunction;
    easingBezier: [number, number, number, number];
    label: { ja: string; en: string };
    lang: 'ja' | 'en';
    onRatingChange: (rating: number) => void;
    rating: number | null;
}

/**
 * インタラクティブなイージングデモコンポーネント
 * アニメーションを再生しながら、その場で評価を行うことができます
 * PreSurveyOverlay内で使用されます
 */
export function InteractiveEasingDemo({
    easingBezier,
    lang,
    onRatingChange,
    rating,
}: InteractiveEasingDemoProps) {
    return (
        <div className="flex items-center gap-4">
            {/* アニメーションデモ表示エリア */}
            <div className="flex-shrink-0 w-48 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg relative overflow-hidden">
                <motion.div
                    animate={{ x: [0, 152, 0] }} // 往復アニメーション
                    transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: easingBezier as any, // ベジェ曲線を適用
                        repeatDelay: 0.5
                    }}
                    className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-md shadow-md"
                />
            </div>

            {/* 評価ボタンエリア */}
            <div className="flex-shrink-0">
                <div className="text-xs text-gray-600 mb-1 text-center">
                    {lang === 'ja' ? '好み度' : 'Preference'}
                </div>
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(value => (
                        <motion.button
                            key={value}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRatingChange(value)}
                            className={`
                                w-10 h-10 rounded-md font-bold text-base transition-all
                                ${rating === value
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md scale-110'
                                    : 'bg-white text-gray-700 hover:bg-purple-100'
                                }
                            `}
                        >
                            {value}
                        </motion.button>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>{lang === 'ja' ? '低' : 'Low'}</span>
                    <span>{lang === 'ja' ? '高' : 'High'}</span>
                </div>
            </div>
        </div>
    );
}
