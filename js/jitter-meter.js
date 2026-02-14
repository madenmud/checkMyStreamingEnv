/**
 * Jitter meter: RTT sampling (HEAD or image ping) and RTP-style jitter stats.
 */
class JitterMeter {
    constructor(config) {
        this.config = config;
        this.samples = [];
        this.jitter = 0;
        this.isRunning = false;
    }

    stop() {
        this.isRunning = false;
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            const done = () => resolve();
            img.onload = done;
            img.onerror = done;
            img.src = url;
        });
    }

    async ping(service) {
        const start = performance.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
        try {
            if (service.testMethod === 'head-ping') {
                await fetch(service.endpoints[0], {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal
                });
            } else {
                const pingUrl = service.endpoints[0].replace(/\/?$/, '') + '/favicon.ico?t=' + Date.now();
                await this.loadImage(pingUrl);
            }
        } catch (e) {
            // Timeout or error: still use elapsed time
        } finally {
            clearTimeout(timeout);
        }
        return performance.now() - start;
    }

    calculateStdDev(arr) {
        if (arr.length === 0) return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const squaredDiffs = arr.map((x) => (x - mean) * (x - mean));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
        return Math.sqrt(variance);
    }

    estimateMOS(jitterMs, packetLossRatio) {
        const mos = 4.5 - (jitterMs * 0.05) - (packetLossRatio * 2);
        return Math.max(1, Math.min(5, mos));
    }

    calculateStats() {
        const timeout = this.config.timeoutMs;
        const rtts = this.samples.filter((s) => s < timeout);
        const n = rtts.length;
        if (n === 0) {
            return {
                avgRtt: 0,
                avgJitter: 0,
                maxJitter: 0,
                stdDev: 0,
                packetLoss: 1,
                mosScore: 1
            };
        }
        const diffs = [];
        for (let i = 1; i < rtts.length; i++) {
            diffs.push(Math.abs(rtts[i] - rtts[i - 1]));
        }
        const avgJitterVal = diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
        const maxJitterVal = diffs.length > 0 ? Math.max(...diffs) : 0;
        const packetLoss = (this.samples.length - n) / this.samples.length;
        return {
            avgRtt: rtts.reduce((a, b) => a + b, 0) / n,
            avgJitter: avgJitterVal,
            maxJitter: maxJitterVal,
            stdDev: this.calculateStdDev(rtts),
            packetLoss,
            mosScore: this.estimateMOS(this.jitter, packetLoss)
        };
    }

    async measure(service, onSample) {
        this.samples = [];
        this.jitter = 0;
        this.isRunning = true;
        for (let i = 0; i < this.config.warmupPings; i++) {
            await this.ping(service);
            if (!this.isRunning) break;
        }
        for (let i = 0; i < this.config.sampleCount; i++) {
            if (!this.isRunning) break;
            const rtt = await this.ping(service);
            this.samples.push(rtt);
            if (i > 0) {
                const diff = rtt - this.samples[i - 1];
                this.jitter = this.config.jitterCalculation(this.jitter, diff);
            }
            if (typeof onSample === 'function') {
                onSample(rtt, this.jitter, i + 1, this.config.sampleCount);
            }
            await this.delay(this.config.intervalMs);
        }
        this.isRunning = false;
        return this.calculateStats();
    }
}
