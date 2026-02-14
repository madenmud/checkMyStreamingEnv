# Hi-Fi Stream Jitter Meter - Technical Specification

## 프로젝트 개요
GitHub Pages 정적 호스팅 기반 웹앱으로, 주요 고음질 스트리밍 서비스의 네트워크 지터(Jitter)를 측정하고 시각화합니다. 로그인 없이 사용 가능하며, Web Audio API와 Performance API를 활용한 정밀 측정을 구현합니다.

---

## 1. 프로젝트 구조

```
hifi-jitter-meter/
├── index.html                 # 메인 진입점
├── css/
│   └── styles.css            # 전체 스타일
├── js/
│   ├── app.js                # 메인 앱 로직
│   ├── jitter-meter.js       # 지터 측정 엔진
│   ├── streaming-services.js # 서비스 설정
│   └── chart-renderer.js     # 그래프 렌더링
├── assets/
│   └── test-audio/           # 테스트용 오디오 파일 (1초 무음)
└── .github/
    └── workflows/
        └── deploy.yml        # GitHub Pages 자동 배포
```

---

## 2. 핵심 기능 명세

### 2.1 지터 측정 시스템

**측정 방식:**
- **Method A: HTTP Ping** - HEAD 요청 기반 RTT 측정 (CORS 허용 서비스)
- **Method B: Image Ping** - 1x1 투명 픽셀 로드 시간 측정 (CORS 차단 서비스)
- **Method C: WebRTC STUN** - ICE candidate 수집 시간 변동성 (가장 정밀)

**측정 파라미터:**
```javascript
const CONFIG = {
    sampleCount: 50,           // 측정 샘플 수
    intervalMs: 100,           // 요청 간격 (ms)
    timeoutMs: 5000,           // 타임아웃
    warmupPings: 5,            // 웜업 요청 수 (통계 제외)
    
    // 지터 계산 (RTP 표준 방식)
    jitterCalculation: (prevJitter, currentDiff) => {
        return prevJitter + (Math.abs(currentDiff) - prevJitter) / 16;
    }
};
```

**측정 지표:**
- 평균 지터 (Average Jitter)
- 최대 지터 (Max Jitter)
- 표준편차 (Standard Deviation)
- 패킷 손실률 (Packet Loss %)
- MOS 점수 예측 (Mean Opinion Score)

### 2.2 테스트 대상 서비스

```javascript
const STREAMING_SERVICES = [
    {
        id: 'tidal',
        name: 'TIDAL',
        tier: 'Master/MQA',
        bitrate: '24bit/96kHz+',
        endpoints: [
            'https://resources.tidal.com/images',
            'https://audio.tidal.com'
        ],
        cors: false,
        testMethod: 'image-ping'
    },
    {
        id: 'qobuz',
        name: 'Qobuz',
        tier: 'Studio Premier',
        bitrate: '24bit/192kHz',
        endpoints: [
            'https://static.qobuz.com',
            'https://streaming.qobuz.com'
        ],
        cors: false,
        testMethod: 'image-ping'
    },
    {
        id: 'apple-music',
        name: 'Apple Music',
        tier: 'Lossless/Hi-Res',
        bitrate: '24bit/192kHz',
        endpoints: [
            'https://audio-ssl.itunes.apple.com',
            'https://mvod.itunes.apple.com'
        ],
        cors: false,
        testMethod: 'image-ping'
    },
    {
        id: 'spotify',
        name: 'Spotify',
        tier: 'Very High (320kbps)',
        bitrate: '16bit/44.1kHz (Ogg)',
        endpoints: [
            'https://audio-fa.scdn.co',
            'https://i.scdn.co'
        ],
        cors: true,
        testMethod: 'head-ping'
    },
    {
        id: 'amazon-music',
        name: 'Amazon Music HD',
        tier: 'HD/Ultra HD',
        bitrate: '24bit/192kHz',
        endpoints: [
            'https://music.amazon.com',
            'https://m.media-amazon.com'
        ],
        cors: false,
        testMethod: 'image-ping'
    },
    {
        id: 'youtube-music',
        name: 'YouTube Music',
        tier: 'High (256kbps AAC)',
        bitrate: '16bit/44.1kHz',
        endpoints: [
            'https://music.youtube.com',
            'https://yt3.ggpht.com'
        ],
        cors: false,
        testMethod: 'image-ping'
    }
];
```

---

## 3. UI/UX 디자인

### 3.1 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  🎵 Hi-Fi Jitter Meter         [설정⚙️] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ TIDAL   │ │ Qobuz   │ │ Apple   │   │
│  │  [시작] │ │  [시작] │ │  [시작] │   │
│  │ 12.3ms  │ │  8.1ms  │ │ 15.2ms  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      실시간 지터 그래프          │    │
│  │    (Chart.js 라인 차트)          │    │
│  │         ~ ~ ~ ~ ~ ~             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  측정 결과:                             │
│  • 평균 지터: 8.5ms  [🟡 보통]          │
│  • 최대 지터: 23.1ms                    │
│  • 예상 버퍼링: 0.2초 (96kHz 기준)       │
│                                         │
│  [측정 저장] [히스토리 보기] [내보내기]   │
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 품질 등급 시스템

| 지터 범위 | 등급 | 색상 | 설명 |
|-----------|------|------|------|
| 0-5ms | 🟢 우수 | #22c55e | Hi-Res 무손실 재생 가능 |
| 5-15ms | 🟡 양호 | #eab308 | CD 품질 무리 없음 |
| 15-30ms | 🟠 보통 | #f97316 | 가끔 스킵 가능 |
| 30ms+ | 🔴 불량 | #ef4444 | 버퍼링 빈번 |

### 3.3 인터랙션 플로우

1. **메인 화면**: 서비스 카드 그리드 표시
2. **측정 시작**: 클릭 → 웜업 → 50회 샘플링 → 결과 표시
3. **실시간 업데이트**: 각 ping 완료 시 그래프 업데이트
4. **결과 저장**: LocalStorage에 타임스탬프와 함께 저장
5. **비교 모드**: 여러 서비스 동시 측정 (최대 3개)

---

## 4. 기술 구현 상세

### 4.1 지터 측정 엔진 (jitter-meter.js)

```javascript
class JitterMeter {
    constructor(config) {
        this.config = config;
        this.samples = [];
        this.jitter = 0;
        this.isRunning = false;
    }

    async measure(service) {
        this.samples = [];
        this.isRunning = true;
        
        // 웜업
        for (let i = 0; i < this.config.warmupPings; i++) {
            await this.ping(service);
        }
        
        // 실제 측정
        for (let i = 0; i < this.config.sampleCount; i++) {
            if (!this.isRunning) break;
            
            const rtt = await this.ping(service);
            this.samples.push(rtt);
            
            // RTP 스타일 지터 계산
            if (i > 0) {
                const diff = rtt - this.samples[i-1];
                this.jitter += (Math.abs(diff) - this.jitter) / 16;
            }
            
            await this.delay(this.config.intervalMs);
        }
        
        return this.calculateStats();
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
                // Image ping for CORS-blocked services
                await this.loadImage(`${service.endpoints[0]}/favicon.ico?t=${Date.now()}`);
            }
        } catch (e) {
            // Timeout or error
        } finally {
            clearTimeout(timeout);
        }
        
        return performance.now() - start;
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // Error also means response received
            img.src = url;
        });
    }

    calculateStats() {
        const rtts = this.samples.filter(s => s < this.config.timeoutMs);
        const diffs = [];
        
        for (let i = 1; i < rtts.length; i++) {
            diffs.push(Math.abs(rtts[i] - rtts[i-1]));
        }
        
        return {
            avgRtt: rtts.reduce((a,b) => a+b) / rtts.length,
            avgJitter: diffs.reduce((a,b) => a+b) / diffs.length,
            maxJitter: Math.max(...diffs),
            stdDev: this.calculateStdDev(rtts),
            packetLoss: (this.samples.length - rtts.length) / this.samples.length,
            mosScore: this.estimateMOS(this.jitter, rtts.length)
        };
    }

    estimateMOS(jitter, packetLoss) {
        // ITU-T G.107 E-model 기반 간단 예측
        let mos = 4.5 - (jitter * 0.05) - (packetLoss * 2);
        return Math.max(1, Math.min(5, mos));
    }
}
```

### 4.2 WebRTC 고급 지터 측정 (선택 기능)

```javascript
class WebRTCJitterMeter {
    async measure() {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        const iceTimes = [];
        const startTime = performance.now();
        
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                iceTimes.push(performance.now() - startTime);
            }
        };
        
        // Create offer to trigger ICE gathering
        await pc.setLocalDescription(await pc.createOffer());
        
        // Wait for gathering complete
        await new Promise(resolve => {
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete') resolve();
            };
            setTimeout(resolve, 5000); // Max 5s
        });
        
        pc.close();
        
        // Calculate jitter from iceTimes
        return this.calculateJitterFromSamples(iceTimes);
    }
}
```

### 4.3 차트 렌더링 (chart-renderer.js)

```javascript
class ChartRenderer {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'RTT (ms)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }, {
                    label: 'Jitter (ms)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                animation: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Milliseconds' }
                    }
                }
            }
        });
    }

    update(rtt, jitter) {
        this.chart.data.labels.push('');
        this.chart.data.datasets[0].data.push(rtt);
        this.chart.data.datasets[1].data.push(jitter);
        
        // Keep last 50 points
        if (this.chart.data.labels.length > 50) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(d => d.data.shift());
        }
        
        this.chart.update();
    }
}
```

---

## 5. GitHub Pages 배포 설정

### 5.1 GitHub Actions Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 5.2 Repository 설정

1. Settings → Pages → Source: GitHub Actions
2. Custom domain (선택): CNAME 파일 추가
3. HTTPS 강제 활성화

---

## 6. 추가 기능 (Phase 2)

### 6.1 오디오 버퍼 시뮬레이션
- Web Audio API로 가상 오디오 버퍼 생성
- 실제 지터 상황에서의 언더런 예측

### 6.2 히스토리 및 분석
- LocalStorage 기반 측정 이력 저장
- 시간대별 네트워크 품질 트렌드
- ISP별 평균 성능 비교 (익명 집계)

### 6.3 고급 시각화
- Waterfall 차트 (시간대별 RTT 분포)
- 히트맵 (요일/시간대 품질)
- 실시간 스펙트럼 분석 (오디오 컨텍스트 활용)

---

## 7. 성능 및 보안 고려사항

### 7.1 최적화
- Ping 요청 병렬화 제한 (최대 3개 동시)
- requestAnimationFrame 기반 UI 업데이트
- Service Worker로 오프라인 지원 (선택)

### 7.2 보안
- CSP (Content Security Policy) 설정
- 외부 리소스 로드 시 SRI (Subresource Integrity)
- 측정 데이터 클라이언트 사이드만 저장

---

## 8. 테스트 체크리스트

- [ ] 각 서비스별 ping 성공/실패 처리
- [ ] 네트워크 오프라인 상태 감지
- [ ] 모바일 브라우저 호환성 (iOS Safari, Chrome Android)
- [ ] 100+ 샘플 측정 시 메모리 누수 확인
- [ ] GitHub Pages 404 에러 처리

---

## 9. 참고 자료

- RTP Jitter Calculation: RFC 3550
- Web Performance API: https://w3c.github.io/hr-time/
- Chart.js Documentation: https://www.chartjs.org/
- GitHub Pages Documentation: https://docs.github.com/pages

---

**프롬프트 지시사항:**
이 스펙을 바탕으로 완전한 단일 페이지 앱(SPA)을 생성해주세요. 
- 순수 HTML/CSS/JS만 사용 (프레임워크 불필요)
- Chart.js CDN 사용
- 모바일 퍼스트 반응형 디자인
- 다크 모드 기본 지원
