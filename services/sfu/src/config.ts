import os from 'os';

function requireEnv(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function intEnv(key: string, fallback: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
}

export const config = {
  httpPort: intEnv('HTTP_PORT', 3000),
  jwtSecret: requireEnv('JWT_SECRET', 'change_me_in_production'),
  logLevel: requireEnv('LOG_LEVEL', 'info'),

  mediasoup: {
    numWorkers: intEnv('MEDIASOUP_NUM_WORKERS', os.cpus().length),
    rtcMinPort: intEnv('RTC_MIN_PORT', 40000),
    rtcMaxPort: intEnv('RTC_MAX_PORT', 49999),
    announcedIp: process.env['ANNOUNCED_IP'] || undefined,

    /**
     * mediasoup router media codecs.
     * Supports VP8 (with simulcast), VP9, H264 and Opus.
     */
    routerMediaCodecs: [
      {
        kind: 'audio' as const,
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        parameters: {
          minptime: 10,
          useinbandfec: 1,
        },
      },
      {
        kind: 'video' as const,
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video' as const,
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
          'profile-id': 2,
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video' as const,
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ],
  },

  ws: {
    maxConnectionsPerIp: intEnv('WS_MAX_CONNECTIONS_PER_IP', 10),
    maxMessageBytes: intEnv('WS_MAX_MESSAGE_BYTES', 65536),
  },
} as const;
