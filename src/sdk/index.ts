/*
LEEWAY HEADER — DO NOT REMOVE
TAG: SDK.ENTRY.CORE
REGION: 🌐 ECOSYSTEM
*/

// Headless RTC Logic
export { FederationRouter, type SfuNode } from '../rtc/federation-router';
export { MeshFallback, handleFallback, shouldFallback } from '../rtc/mesh-fallback';
export { VectorAgent, type StatsSample } from '../rtc/vector-agent';
export { useRTCStore, type RTCState, type PeerStats, type RTCEvent } from '../rtc/store';
export { LeewayRTCNative } from '../rtc/leeway-rtc-native';

// Pre-packaged UI Components for Developers
export { default as DiagnosticSpectrum } from '../components/DiagnosticSpectrum';
export { default as VoiceTuner } from '../components/VoiceTuner';
export { default as VisionLab } from '../components/VisionLab';
export { default as AgentHub } from '../components/AgentHub';
export { default as EconomicMoat } from '../components/EconomicMoat';
export { default as GalaxyBackground } from '../components/GalaxyBackground';

// Setup Interface
export class LeewaySDK {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log(`[LeeWay SDK] Initialized Sovereign Communication Hybrid. Validation OK.`);
  }

  // Example hook for developers to quickly wrap their apps
  public getAuthParams() {
    return {
      key: this.apiKey,
      timestamp: Date.now(),
    };
  }
}
