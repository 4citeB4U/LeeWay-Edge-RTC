/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebSocket URL for the SFU signaling server, e.g. wss://my-sfu.fly.dev/ws */
  readonly VITE_SIGNALING_URL?: string;
  /** HTTP base URL for the SFU API, e.g. https://my-sfu.fly.dev */
  readonly VITE_HTTP_BASE_URL?: string;
  /** Legacy alias for VITE_SIGNALING_URL */
  readonly VITE_SFU_WS_URL?: string;
  /** Legacy alias for /dev/token endpoint */
  readonly VITE_TOKEN_URL?: string;
  /** Base path for GitHub Pages deployment, e.g. /LeeWay-Edge-RTC/ */
  readonly VITE_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
