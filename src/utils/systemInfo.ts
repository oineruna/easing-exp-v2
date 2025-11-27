// システム情報取得ユーティリティ
// 実験環境のパフォーマンス計測やデバイス情報の収集を行います

/**
 * フレームレート（FPS）を測定するクラス
 * アニメーションの滑らかさを定量的に評価するために使用します
 */
export class FrameRateMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 0;
    private animationFrameId: number | null = null;
    private fpsHistory: number[] = [];
    private isRunning = false;

    /**
     * モニタリングを開始します
     * requestAnimationFrameループを起動します
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsHistory = [];
        this.measureFPS();
    }

    /**
     * モニタリングを停止します
     * ループをキャンセルし、リソースを解放します
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * フレームレートを測定する内部ループ関数
     * 1秒ごとにフレーム数をカウントしてFPSを算出します
     */
    private measureFPS = () => {
        if (!this.isRunning) return;

        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        // 1秒（1000ms）経過したらFPSを計算
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.fpsHistory.push(this.fps);

            // 履歴は最大60秒分保持（メモリ節約のため）
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }

            // カウンタをリセット
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        // 次のフレームを予約
        this.animationFrameId = requestAnimationFrame(this.measureFPS);
    };

    /**
     * 現在の瞬時FPSを取得します
     */
    getCurrentFPS(): number {
        return this.fps;
    }

    /**
     * 記録されたFPSの統計情報（平均、最小、最大など）を取得します
     * 実験タスク終了時に呼び出してデータを保存します
     */
    getStats() {
        if (this.fpsHistory.length === 0) {
            return {
                current: this.fps,
                average: 0,
                min: 0,
                max: 0,
                samples: 0,
            };
        }

        const average = Math.round(
            this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
        );
        const min = Math.min(...this.fpsHistory);
        const max = Math.max(...this.fpsHistory);

        return {
            current: this.fps,
            average,
            min,
            max,
            samples: this.fpsHistory.length,
        };
    }

    /**
     * FPS履歴と状態をリセットします
     */
    reset() {
        this.fpsHistory = [];
        this.frameCount = 0;
        this.fps = 0;
    }
}

// IPアドレス取得機能はプライバシー配慮のためコメントアウトされています
// 必要に応じて有効化してください

// /**
//  * IPアドレスを取得（WebRTC経由）
//  */
// export async function getClientIP(): Promise<string> { ... }

// /**
//  * 外部IPアドレスを取得（外部APIを使用）
//  */
// export async function getPublicIP(): Promise<string> { ... }

/**
 * ブラウザのユーザーエージェント情報を取得します
 * OSやブラウザの種類・バージョンを特定するために使用します
 */
export function getUserAgent(): string {
    return navigator.userAgent;
}

/**
 * 画面解像度やピクセル比などのディスプレイ情報を取得します
 * 参加者の閲覧環境を把握するために使用します
 */
export function getScreenInfo() {
    return {
        width: window.screen.width,             // 画面全体の幅
        height: window.screen.height,           // 画面全体の高さ
        availWidth: window.screen.availWidth,   // 利用可能な幅（タスクバー除く）
        availHeight: window.screen.availHeight, // 利用可能な高さ
        colorDepth: window.screen.colorDepth,   // 色深度
        pixelRatio: window.devicePixelRatio,    // ピクセル比（Retina判定など）
    };
}
