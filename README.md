# Streaming Jitter Test by 깜깜한곱슬이

고음질 스트리밍 서비스의 **네트워크 지터(Jitter)**를 측정하고 시각화하는 웹앱입니다.  
로그인 없이 브라우저에서 바로 사용할 수 있으며, GitHub Pages로 배포됩니다.

## 기능

- **서비스별 측정**: TIDAL, Qobuz, Apple Music, Spotify, Amazon Music HD, YouTube Music 각각 지터 측정
- **전체 지터 측정**: 6개 서비스를 한 번에 측정해 결과를 테이블로 비교 (평균 지터 기준 정렬)
- **실시간 그래프**: RTT·지터 추이를 Chart.js 라인 차트로 표시
- **품질 등급**: 우수(0–5ms) / 양호(5–15ms) / 보통(15–30ms) / 불량(30ms+) 자동 표시
- **측정 결과 저장**: LocalStorage에 이력 저장, 히스토리 보기 및 JSON 내보내기
- **다크/라이트 모드**: 시스템 설정에 따른 테마 지원
- **모바일 퍼스트**: 반응형 레이아웃

## 측정 대상 서비스

| 서비스 | 티어 | 비트레이트 |
|--------|------|------------|
| TIDAL | Master/MQA | 24bit/96kHz+ |
| Qobuz | Studio Premier | 24bit/192kHz |
| Apple Music | Lossless/Hi-Res | 24bit/192kHz |
| Spotify | Very High | 16bit/44.1kHz (Ogg) |
| Amazon Music HD | HD/Ultra HD | 24bit/192kHz |
| YouTube Music | High | 16bit/44.1kHz |

## 로컬에서 실행

1. 저장소 클론 후 프로젝트 폴더로 이동
2. 정적 서버 실행 (예: `npx serve .` 또는 `python -m http.server 8080`)
3. 브라우저에서 `http://localhost:포트번호` 접속

```bash
git clone https://github.com/madenmud/checkMyStreamingEnv.git
cd checkMyStreamingEnv
npx serve .
# http://localhost:3000 등 표시된 주소로 접속
```

## GitHub에서 SPA 서비스하기 (GitHub Pages)

이 프로젝트는 정적 파일만 사용하므로 **GitHub Pages**로 그대로 서비스할 수 있습니다.

### 1. 배포 설정

1. GitHub 저장소 페이지에서 **Settings** → 왼쪽 메뉴 **Pages**
2. **Build and deployment** → **Source**에서 **GitHub Actions** 선택
3. (이미 `.github/workflows/deploy.yml`이 있으므로) `main` 브랜치에 푸시하면 자동으로 배포됩니다.

### 2. 접속 주소

- **사용자/조직 사이트가 아닌 경우** (저장소 이름이 `checkMyStreamingEnv`일 때):  
  `https://<사용자명>.github.io/checkMyStreamingEnv/`
- 루트가 아니라 **저장소 이름까지 포함한 경로**가 기본 URL입니다.

### 3. SPA에서 하위 경로 처리 (404.html)

GitHub Pages는 실제로 없는 경로(예: `/results`, `/about`)에 접속하면 404를 반환합니다.  
이 프로젝트에는 **404.html**이 들어 있어, 존재하지 않는 경로로 들어와도 **메인 페이지(앱)로 돌려보냅니다.**

- 나중에 클라이언트 라우팅(예: `/history`, `/settings`)을 넣을 때도, 404.html 덕분에 새로고침·직접 접속이 가능합니다.
- **포크해서 사용할 때**: 404.html 안의 리다이렉트는 저장소 경로 첫 단계(예: `/checkMyStreamingEnv/`)를 쓰므로, 저장소 이름을 바꾼 경우 404.html 안 `segments[0]` 기준이 그 이름으로 동작합니다. 별도 수정 없이 대부분 그대로 사용 가능합니다.

### 4. 요약

| 단계 | 할 일 |
|------|--------|
| 1 | Settings → Pages → Source: **GitHub Actions** |
| 2 | `main`에 푸시 → 자동 빌드·배포 |
| 3 | `https://<사용자명>.github.io/<저장소이름>/` 로 접속 |

## 프로젝트 구조

```
├── index.html              # 메인 진입점
├── css/
│   └── styles.css          # 스타일 (다크/라이트, 반응형)
├── js/
│   ├── app.js              # 앱 로직, UI, 히스토리/내보내기
│   ├── jitter-meter.js     # 지터 측정 엔진 (HEAD/Image ping, RTP 지터)
│   ├── streaming-services.js # 서비스 설정 및 CONFIG
│   └── chart-renderer.js   # Chart.js 실시간 그래프
├── assets/
│   └── test-audio/         # 테스트용 오디오 (예정)
└── .github/workflows/
    └── deploy.yml          # GitHub Pages 자동 배포
```

## 기술 스택

- **HTML / CSS / JavaScript** (바닐라, 프레임워크 없음)
- **Chart.js** (CDN) — 실시간 RTT·지터 차트
- **Performance API** — RTT 측정
- **LocalStorage** — 측정 이력 저장

## 측정 방식

- **HEAD Ping**: CORS 허용 서비스(예: Spotify) — `fetch` HEAD 요청
- **Image Ping**: CORS 제한 서비스 — 소형 이미지 로드 시간으로 RTT 추정
- **지터 계산**: RTP(RFC 3550) 스타일 누적 지터 (샘플 50회, 웜업 5회)

데이터는 모두 클라이언트에서만 처리되며 외부 서버로 전송되지 않습니다.

## 라이선스

이 프로젝트는 개인/교육 목적으로 자유롭게 사용할 수 있습니다.
