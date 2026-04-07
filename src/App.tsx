/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.APP.ROOT
TAG: UI.APP.ROOT.COMPONENT
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=layout-dashboard
5WH:
  WHAT = Root React component — renders LeeWay Edge RTC dashboard
  WHY  = Single composition root for the entire UI surface
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = src/App.tsx
  WHEN = 2026
  HOW  = Imports and renders <LeeWayEdgeRtc /> from root LeeWay-Edge_RTC.tsx
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/
import LeeWayEdgeRtc from '../LeeWay-Edge_RTC';

export default function App() {
  return <LeeWayEdgeRtc />;
}
