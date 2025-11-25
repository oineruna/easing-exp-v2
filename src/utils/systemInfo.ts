// システム情報取得ユーティリティ

/**
 * フレームレートを測定するクラス
 */
export class FrameRateMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 0;
    private animationFrameId: number | null = null;
    private fpsHistory: number[] = [];
    private isRunning = false;

    /**
   * モニタリングを開始
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
     * モニタリングを停止
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * フレームレートを測定
     */
    private measureFPS = () => {
        if (!this.isRunning) return;

        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        // 1秒ごとにFPSを計算
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.fpsHistory.push(this.fps);

            // 履歴は最大60秒分保持
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }

            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        this.animationFrameId = requestAnimationFrame(this.measureFPS);
    };

    /**
     * 現在のFPSを取得
     */
    getCurrentFPS(): number {
        return this.fps;
    }

    /**
     * FPS統計を取得
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
     * FPS履歴をリセット
     */
    reset() {
        this.fpsHistory = [];
        this.frameCount = 0;
        this.fps = 0;
    }
}

/**
 * IPアドレスを取得（WebRTC経由）
 */
export async function getClientIP(): Promise<string> {
    try {
        // WebRTCを使用してローカルIPを取得
        const pc = new RTCPeerConnection({
            iceServers: [],
        });

        pc.createDataChannel("");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        return new Promise((resolve) => {
            pc.onicecandidate = (event) => {
                if (!event || !event.candidate) {
                    resolve("unknown");
                    return;
                }

                const candidate = event.candidate.candidate;
                const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
                const match = candidate.match(ipRegex);

                if (match) {
                    resolve(match[0]);
                    pc.close();
                }
            };

            // タイムアウト処理（3秒）
            setTimeout(() => {
                resolve("unknown");
                pc.close();
            }, 3000);
        });
    } catch (error) {
        console.error("Failed to get IP address:", error);
        return "unknown";
    }
}

/**
 * 外部IPアドレスを取得（外部APIを使用）
 */
export async function getPublicIP(): Promise<string> {
    try {
        const response = await fetch("https://api.ipify.org?format=json", {
            signal: AbortSignal.timeout(3000),
        });
        const data = await response.json();
        return data.ip || "unknown";
    } catch (error) {
        console.error("Failed to get public IP:", error);
        return "unknown";
    }
}

/**
 * ユーザーエージェント情報を取得
 */
export function getUserAgent(): string {
    return navigator.userAgent;
}

/**
 * 画面情報を取得
 */
export function getScreenInfo() {
    return {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
    };
}
