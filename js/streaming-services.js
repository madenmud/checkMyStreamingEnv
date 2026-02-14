/**
 * Measurement configuration (RTP-style jitter, sample count, intervals).
 */
const CONFIG = {
    sampleCount: 50,
    intervalMs: 100,
    timeoutMs: 5000,
    warmupPings: 5,
    jitterCalculation: (prevJitter, currentDiff) => {
        return prevJitter + (Math.abs(currentDiff) - prevJitter) / 16;
    }
};

/**
 * Streaming services to test (endpoints, tier, test method).
 */
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
