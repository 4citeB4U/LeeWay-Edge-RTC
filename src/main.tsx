/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.BOOTSTRAP
TAG: CLIENT.ENTRY.MAIN
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=power
5WH:
  WHAT = React 19 application entry point
  WHY  = Bootstraps LeeWay Edge RTC into the DOM
  WHO  = LEEWAY INNOVATIONS A LEEWAY INDUSTY CREATION
  WHERE = src/main.tsx
  WHEN = 2026
  HOW  = ReactDOM.createRoot + StrictMode render of <App />
AGENTS: ASSESS ALIGN AUDIT
LICENSE: PROPRIETARY
*/
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
