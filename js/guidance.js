/**
 * Hi-Fi Jitter Meter - Guidance Engine
 * Based on the specified optimization algorithms.
 */
class GuidanceEngine {
    constructor() {}

    /**
     * Generate complete guidance based on measurement stats and service config.
     */
    generate(stats, service) {
        const jitter = stats.avgJitter;
        const maxJitter = stats.maxJitter;
        const rtt = stats.avgRtt;
        const loss = stats.packetLoss;

        const bufferMs = Math.max(maxJitter * 1.5, 50);
        const cpuLoad = this.estimateCPULoad(maxJitter, loss);
        const hardwareGrade = this.determineHardwareGrade(maxJitter, 2048); // Assume 2GB for baseline

        return {
            immediateActions: this.getImmediateActions(maxJitter, service),
            networkGuide: this.getNetworkGuide(rtt, jitter, maxJitter),
            systemGuide: this.getSystemGuide(bufferMs, cpuLoad),
            softwareRecommendations: this.getSoftwareRecommendations(jitter),
            warnings: this.getWarnings(jitter, maxJitter, service, loss)
        };
    }

    estimateCPULoad(maxJitter, loss) {
        let load = 5; // Base
        if (maxJitter > 100) load += 0.5;
        if (maxJitter > 500) load += 1.0;
        if (maxJitter > 2000) load += 2.0;
        load += (loss * 100) * 2;
        return load;
    }

    determineHardwareGrade(maxJitter, memoryMB) {
        const memGB = memoryMB / 1024;
        if (maxJitter < 50 && memGB <= 1) return { id: 'entry', label: '임베디드/IoT' };
        if (maxJitter < 150 && memGB <= 2) return { id: 'mobile', label: '모바일/저전력' };
        if (maxJitter < 500 && memGB <= 4) return { id: 'desktop', label: '일반 데스크톱' };
        if (maxJitter < 1000 && memGB <= 8) return { id: 'performance', label: '고성능 오디오 전용' };
        return { id: 'server', label: '전용 버퍼링 서버 필요' };
    }

    getImmediateActions(maxJitter, service) {
        const actions = [];
        if (maxJitter > 1000) {
            actions.push({
                priority: 'critical',
                action: 'WiFi → 유선 연결 전환',
                reason: '극심한 지터는 무선 환경의 특성입니다.',
                effect: '50% 이상 지터 감소 가능'
            });
        }
        if (maxJitter > 500) {
            actions.push({
                priority: 'high',
                action: '라우터 QoS 활성화',
                reason: '오디오 패킷에 우선순위를 부여해야 합니다.',
                tip: '라우터 설정에서 오디오/스트리밍 우선순위 활성화'
            });
        }
        if (service.name.includes('TIDAL') || service.name.includes('Spotify')) {
            actions.push({
                priority: 'medium',
                action: 'DNS 최적화',
                reason: '해외 CDN 접속 효율 개선',
                tip: 'Cloudflare DNS (1.1.1.1) 권장'
            });
        }
        return actions;
    }

    getNetworkGuide(rtt, jitter, maxJitter) {
        return {
            status: jitter < 50 ? '우수' : jitter < 150 ? '양호' : '개선 필요',
            recommendation: maxJitter > 200 ? '유선 Ethernet 연결' : 'WiFi 5GHz 대역 사용',
            wifiTip: rtt > 100 ? '5GHz 필수 및 채널 수동 고정 권장' : '현재 대역 유지 가능',
            bufferbloat: 'SQM(fq_codel) 설정을 통해 버퍼블로트 해결 권장'
        };
    }

    getSystemGuide(bufferMs, cpuLoad) {
        return {
            os: cpuLoad > 10 ? '리얼타임 커널 Linux 권장' : 'Windows/macOS 고성능 모드',
            audio: {
                driver: 'ASIO 또는 CoreAudio (전용 드라이버)',
                buffer: `${bufferMs.toFixed(0)}ms`,
                bitDepth: '24bit 이상 고정'
            },
            optimization: [
                '전원 관리: 고성능 모드 필히 사용',
                'USB 선택적 절전 모드 해제',
                '백그라운드 앱 및 자동 업데이트 일시 중지'
            ]
        };
    }

    getSoftwareRecommendations(jitter) {
        const recs = [];
        if (jitter > 300) {
            recs.push({ name: 'Roon', reason: '강력한 네트워크 버퍼링 및 격리 재생' });
            recs.push({ name: 'Audirvana', reason: '메모리 플레이백을 통한 지터 영향 최소화' });
        } else if (jitter > 100) {
            recs.push({ name: 'Foobar2000 (WASAPI)', reason: '경량화된 오디오 경로 제공' });
        } else {
            recs.push({ name: '공식 앱', reason: '현재 환경에서 충분한 성능 발휘 가능' });
        }
        return recs;
    }

    getWarnings(jitter, maxJitter, service, loss) {
        const warnings = [];
        if (maxJitter > 2000) {
            warnings.push({ level: 'critical', text: '현재 환경에서는 무손실 스트리밍이 사실상 불가능합니다.' });
        }
        if (loss > 0.02) {
            warnings.push({ level: 'high', text: '패킷 손실이 감지되었습니다. 오디오 튐(Drop-out) 현상이 발생할 수 있습니다.' });
        }
        if (jitter > 150 && service.bitrate.includes('24bit')) {
            warnings.push({ level: 'medium', text: '고음질(Hi-Res) 재생 시 버퍼 언더런 위험이 있습니다.' });
        }
        return warnings;
    }
}
