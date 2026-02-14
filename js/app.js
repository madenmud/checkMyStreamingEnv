/**
 * Hi-Fi Jitter Meter - main app: UI, measurement orchestration, history, export.
 */
(function () {
    const STORAGE_KEY = 'hifi-jitter-history';
    const MAX_HISTORY = 100;
    const QUALITY_LEVELS = [
        { max: 5, label: '우수', emoji: '🟢', color: '#22c55e' },
        { max: 15, label: '양호', emoji: '🟡', color: '#eab308' },
        { max: 30, label: '보통', emoji: '🟠', color: '#f97316' },
        { max: Infinity, label: '불량', emoji: '🔴', color: '#ef4444' }
    ];

    function getQuality(avgJitter) {
        for (let i = 0; i < QUALITY_LEVELS.length; i++) {
            if (avgJitter < QUALITY_LEVELS[i].max) return QUALITY_LEVELS[i];
        }
        return QUALITY_LEVELS[QUALITY_LEVELS.length - 1];
    }

    function formatMs(value) {
        if (value == null || isNaN(value)) return '—';
        return value.toFixed(1) + 'ms';
    }

    function formatPercent(value) {
        if (value == null || isNaN(value)) return '—';
        return (value * 100).toFixed(1) + '%';
    }

    function estimateBufferSeconds(avgJitterMs, sampleRateKhz) {
        if (!sampleRateKhz || sampleRateKhz <= 0) return null;
        const bufferMs = Math.max(avgJitterMs * 2, 50);
        return (bufferMs / 1000).toFixed(1);
    }

    function loadHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveResult(serviceId, serviceName, stats) {
        const list = loadHistory();
        list.unshift({
            ts: Date.now(),
            serviceId,
            serviceName,
            avgRtt: stats.avgRtt,
            avgJitter: stats.avgJitter,
            maxJitter: stats.maxJitter,
            stdDev: stats.stdDev,
            packetLoss: stats.packetLoss,
            mosScore: stats.mosScore
        });
        const trimmed = list.slice(0, MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }

    function exportHistory() {
        const list = loadHistory();
        const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'hifi-jitter-history-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function renderServiceCards(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = STREAMING_SERVICES.map(
            (s) => `
        <article class="service-card" data-service-id="${s.id}">
          <h3 class="service-name">${s.name}</h3>
          <p class="service-tier">${s.tier}</p>
          <p class="service-bitrate">${s.bitrate}</p>
          <p class="service-value" data-value="${s.id}">—</p>
          <button type="button" class="btn btn-start" data-service-id="${s.id}">측정 시작</button>
        </article>`
        ).join('');
    }

    function bindServiceButtons(onStart) {
        document.querySelectorAll('.btn-start[data-service-id]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-service-id');
                const service = STREAMING_SERVICES.find((s) => s.id === id);
                if (service) onStart(service);
            });
        });
    }

    function setCardValue(serviceId, text) {
        const el = document.querySelector('.service-value[data-value="' + serviceId + '"]');
        if (el) el.textContent = text;
    }

    function setCardLoading(serviceId, loading) {
        const card = document.querySelector('.service-card[data-service-id="' + serviceId + '"]');
        if (!card) return;
        const btn = card.querySelector('.btn-start');
        if (btn) {
            btn.disabled = loading;
            btn.textContent = loading ? '측정 중…' : '측정 시작';
        }
    }

    function showResults(stats, serviceId, serviceName, sampleRateKhz) {
        const q = getQuality(stats.avgJitter);
        const bufSec = estimateBufferSeconds(stats.avgJitter, sampleRateKhz);
        const resultEl = document.getElementById('measure-result');
        if (!resultEl) return;
        resultEl.classList.remove('hidden');
        resultEl.setAttribute('data-service-id', serviceId || '');
        resultEl.innerHTML = `
      <h3>측정 결과</h3>
      <ul class="result-list">
        <li>평균 지터: ${formatMs(stats.avgJitter)} <span class="quality-badge" style="background:${q.color}">${q.emoji} ${q.label}</span></li>
        <li>최대 지터: ${formatMs(stats.maxJitter)}</li>
        <li>평균 RTT: ${formatMs(stats.avgRtt)}</li>
        <li>표준편차: ${formatMs(stats.stdDev)}</li>
        <li>패킷 손실: ${formatPercent(stats.packetLoss)}</li>
        <li>MOS 예측: ${stats.mosScore != null ? stats.mosScore.toFixed(1) : '—'}</li>
        ${bufSec != null ? '<li>예상 버퍼링: ' + bufSec + '초 (96kHz 기준)</li>' : ''}
      </ul>
      <p class="result-service">서비스: ${serviceName}</p>
      <div class="result-actions">
        <button type="button" class="btn btn-save" id="btn-save-result">측정 저장</button>
        <button type="button" class="btn btn-history" id="btn-history">히스토리 보기</button>
        <button type="button" class="btn btn-export" id="btn-export">내보내기</button>
      </div>`;
        const saveBtn = document.getElementById('btn-save-result');
        const historyBtn = document.getElementById('btn-history');
        const exportBtn = document.getElementById('btn-export');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                saveResult(serviceId || 'unknown', serviceName, stats);
                saveBtn.textContent = '저장됨';
                saveBtn.disabled = true;
            });
        }
        if (historyBtn) {
            historyBtn.addEventListener('click', showHistoryModal);
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', exportHistory);
        }
    }

    function showHistoryModal() {
        const list = loadHistory();
        const lines = list.slice(0, 30).map((r) => {
            const d = new Date(r.ts);
            const q = getQuality(r.avgJitter);
            return `${d.toLocaleString()} | ${r.serviceName} | 평균지터 ${formatMs(r.avgJitter)} ${q.emoji}`;
        });
        const content = lines.length ? lines.join('\n') : '저장된 측정 이력이 없습니다.';
        const modal = document.getElementById('history-modal');
        const pre = document.getElementById('history-content');
        if (modal && pre) {
            pre.textContent = content;
            modal.classList.remove('hidden');
        }
    }

    function closeHistoryModal() {
        const modal = document.getElementById('history-modal');
        if (modal) modal.classList.add('hidden');
    }

    let lastAllResults = [];

    function renderAllResultsTable(results) {
        const wrap = document.getElementById('all-result-table-wrap');
        const progressEl = document.getElementById('all-result-progress');
        if (!wrap) return;
        if (progressEl) progressEl.textContent = '';
        const sorted = [...results].sort((a, b) => (a.stats.avgJitter || 0) - (b.stats.avgJitter || 0));
        wrap.innerHTML = `
      <table class="all-result-table" aria-label="전체 지터 측정 결과">
        <thead>
          <tr>
            <th>서비스</th>
            <th class="num">평균 지터</th>
            <th class="num">최대 지터</th>
            <th>품질</th>
            <th class="num">평균 RTT</th>
            <th class="num">패킷 손실</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((r) => {
            const q = getQuality(r.stats.avgJitter);
            return `<tr>
              <td><strong>${r.serviceName}</strong></td>
              <td class="num">${formatMs(r.stats.avgJitter)}</td>
              <td class="num">${formatMs(r.stats.maxJitter)}</td>
              <td><span class="quality-badge" style="background:${q.color}">${q.emoji} ${q.label}</span></td>
              <td class="num">${formatMs(r.stats.avgRtt)}</td>
              <td class="num">${formatPercent(r.stats.packetLoss)}</td>
            </tr>`;
        }).join('')}
        </tbody>
      </table>`;
    }

    function runMeasureAll(meter, chartRenderer) {
        const btnAll = document.getElementById('btn-measure-all');
        const allSection = document.getElementById('all-result-section');
        const progressEl = document.getElementById('all-result-progress');
        const resultBlock = document.getElementById('measure-result');
        if (resultBlock) resultBlock.classList.add('hidden');
        if (allSection) allSection.classList.remove('hidden');
        if (progressEl) progressEl.textContent = '측정 중… (0/' + STREAMING_SERVICES.length + ')';
        if (btnAll) btnAll.disabled = true;
        STREAMING_SERVICES.forEach((s) => setCardLoading(s.id, true));
        if (chartRenderer) chartRenderer.reset();
        lastAllResults = [];
        const total = STREAMING_SERVICES.length;
        let done = 0;
        function runNext(index) {
            if (index >= total) {
                renderAllResultsTable(lastAllResults);
                if (btnAll) btnAll.disabled = false;
                STREAMING_SERVICES.forEach((s) => setCardLoading(s.id, false));
                const saveBtn = document.getElementById('btn-save-all');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '전체 결과 저장';
                }
                return;
            }
            const service = STREAMING_SERVICES[index];
            setCardValue(service.id, '측정 중…');
            if (progressEl) progressEl.textContent = '측정 중… (' + index + '/' + total + ') ' + service.name;
            meter.measure(service, (rtt, jitter, cur, tot) => {
                setCardValue(service.id, formatMs(jitter) + ' (' + cur + '/' + tot + ')');
                if (chartRenderer) chartRenderer.update(rtt, jitter);
            }).then((stats) => {
                setCardValue(service.id, formatMs(stats.avgJitter));
                lastAllResults.push({ serviceId: service.id, serviceName: service.name, stats });
                done++;
                if (progressEl) progressEl.textContent = '측정 중… (' + done + '/' + total + ')';
                runNext(index + 1);
            }).catch(() => {
                setCardValue(service.id, '오류');
                setCardLoading(service.id, false);
                done++;
                runNext(index + 1);
            });
        }
        runNext(0);
    }

    function saveAllResultsOnce() {
        const btn = document.getElementById('btn-save-all');
        lastAllResults.forEach((r) => saveResult(r.serviceId, r.serviceName, r.stats));
        if (btn) {
            btn.textContent = '저장됨';
            btn.disabled = true;
        }
    }

    function exportAllResultsOnce() {
        const blob = new Blob([JSON.stringify(lastAllResults, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'hifi-jitter-all-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function initApp() {
        renderServiceCards('service-cards');
        const chartEl = document.getElementById('jitter-chart');
        let chartRenderer = null;
        if (chartEl) {
            chartRenderer = new ChartRenderer('jitter-chart');
        }
        const meter = new JitterMeter(CONFIG);
        let currentServiceId = null;

        bindServiceButtons(async (service) => {
            if (currentServiceId) return;
            currentServiceId = service.id;
            document.body.setAttribute('data-current-service-id', service.id);
            setCardLoading(service.id, true);
            setCardValue(service.id, '…');
            if (chartRenderer) chartRenderer.reset();
            const resultBlock = document.getElementById('measure-result');
            if (resultBlock) resultBlock.classList.add('hidden');
            const onSample = (rtt, jitter, current, total) => {
                setCardValue(service.id, formatMs(jitter) + ' (' + current + '/' + total + ')');
                if (chartRenderer) chartRenderer.update(rtt, jitter);
            };
            try {
                const stats = await meter.measure(service, onSample);
                setCardValue(service.id, formatMs(stats.avgJitter));
                showResults(stats, service.id, service.name, 96);
            } catch (e) {
                setCardValue(service.id, '오류');
            }
            setCardLoading(service.id, false);
            currentServiceId = null;
            document.body.removeAttribute('data-current-service-id');
        });

        document.getElementById('btn-measure-all')?.addEventListener('click', () => {
            if (currentServiceId) return;
            runMeasureAll(meter, chartRenderer);
        });
        document.getElementById('btn-save-all')?.addEventListener('click', saveAllResultsOnce);
        document.getElementById('btn-export-all')?.addEventListener('click', exportAllResultsOnce);
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            alert('설정은 추후 Phase 2에서 제공됩니다.');
        });
        document.getElementById('history-close')?.addEventListener('click', closeHistoryModal);
        document.getElementById('history-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'history-modal') closeHistoryModal();
        });

        if (!navigator.onLine) {
            const notice = document.getElementById('offline-notice');
            if (notice) notice.classList.remove('hidden');
        }
        window.addEventListener('online', () => {
            const notice = document.getElementById('offline-notice');
            if (notice) notice.classList.add('hidden');
        });
        window.addEventListener('offline', () => {
            const notice = document.getElementById('offline-notice');
            if (notice) notice.classList.remove('hidden');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
