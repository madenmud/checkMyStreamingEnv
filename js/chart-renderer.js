/**
 * Real-time RTT and jitter line chart (Chart.js).
 */
class ChartRenderer {
    constructor(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        this.canvas = canvas;
        this.maxPoints = 50;
        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'RTT (ms)',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Jitter (ms)',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                animation: false,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    x: {
                        display: true,
                        title: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Milliseconds' }
                    }
                }
            }
        });
    }

    update(rtt, jitter) {
        if (!this.chart) return;
        const data = this.chart.data;
        data.labels.push('');
        data.datasets[0].data.push(Math.round(rtt * 10) / 10);
        data.datasets[1].data.push(Math.round(jitter * 10) / 10);
        if (data.labels.length > this.maxPoints) {
            data.labels.shift();
            data.datasets.forEach((d) => d.data.shift());
        }
        this.chart.update('none');
    }

    reset() {
        if (!this.chart) return;
        this.chart.data.labels = [];
        this.chart.data.datasets.forEach((d) => (d.data = []));
        this.chart.update('none');
    }
}
