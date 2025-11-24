import { motion } from "framer-motion";
import { t } from "../utils/i18n";
import type { Lang } from "../experiment";

interface StartScreenProps {
    isVisible: boolean;
    lang: Lang;
    participantId: string;
    onStart: () => void;
    onTutorial: () => void;
}

export function StartScreen({
    isVisible,
    lang,
    participantId,
    onStart,
    onTutorial,
}: StartScreenProps) {
    if (!isVisible) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-white/80 backdrop-blur-md z-40"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 300,
                    }}
                    className="glass-effect rounded-3xl p-12 max-w-4xl w-full shadow-2xl text-center relative overflow-hidden pointer-events-auto"
                >
                    {/* 装飾的な背景要素 */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8"
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-gray-100 text-gray-500 text-sm font-mono mb-4">
                                ID: {participantId}
                            </span>
                            <h1 className="text-5xl font-black mb-2 tracking-tight text-gray-900">
                                {t(lang, "welcomeTitle")}
                            </h1>
                            <p className="text-xl text-gray-500 font-medium">
                                {t(lang, "welcomeSubtitle")}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left"
                        >
                            <div className="bg-white/60 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-3xl mb-3">🎯</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-800">
                                    {lang === "ja" ? "目的" : "Goal"}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {lang === "ja"
                                        ? "メニューから指定されたアイテムを素早く正確に見つけてください。"
                                        : "Find the specified item from the menu quickly and accurately."}
                                </p>
                            </div>
                            <div className="bg-white/60 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-3xl mb-3">✨</div>
                                <h3 className="font-bold text-lg mb-2 text-gray-800">
                                    {lang === "ja" ? "アニメーション" : "Animation"}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {lang === "ja"
                                        ? "メニューの動き（イージング）が変化します。その違いも感じ取ってください。"
                                        : "Menu animation (easing) will change. Please feel the difference."}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onTutorial}
                                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-blue-400 hover:text-blue-600 transition shadow-sm w-full sm:w-auto"
                            >
                                {t(lang, "startTutorial")}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onStart}
                                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition w-full sm:w-auto"
                            >
                                {t(lang, "startTask")}
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
