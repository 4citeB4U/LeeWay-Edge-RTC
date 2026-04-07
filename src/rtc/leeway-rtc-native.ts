/*
LEEWAY HEADER — DO NOT REMOVE
TAG: MCP.RTC.NATIVE.SDK
REGION: 🟣 MCP
*/

import { mediaDevices, RTCPeerConnection } from 'react-native-webrtc';

export class LeewayRTCNative {
  pc: RTCPeerConnection;
  stream: any;

  constructor(iceServers: any[]) {
    this.pc = new RTCPeerConnection({ iceServers });
  }

  async startAudio() {
    this.stream = await mediaDevices.getUserMedia({ audio: true });

    this.stream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.stream);
    });
  }

  onRemoteStream(cb: (stream: any) => void) {
    this.pc.ontrack = (e) => cb(e.streams[0]);
  }
}
