import { useEffect, useRef } from 'react';
import type { RemoteStream } from './useWebRTC';

interface Props {
  remoteStreams: RemoteStream[];
}

export function RemoteAudio({ remoteStreams }: Props) {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    for (const rs of remoteStreams) {
      let el = audioRefs.current.get(rs.producerId);
      if (!el) {
        el = document.createElement('audio');
        el.autoplay = true;
        (el as HTMLVideoElement).playsInline = true;
        document.body.appendChild(el);
        audioRefs.current.set(rs.producerId, el);
      }
      el.srcObject = rs.stream;
    }

    // Remove stale audio elements
    for (const [id, el] of audioRefs.current) {
      if (!remoteStreams.find((s) => s.producerId === id)) {
        el.remove();
        audioRefs.current.delete(id);
      }
    }
  }, [remoteStreams]);

  return null;
}
