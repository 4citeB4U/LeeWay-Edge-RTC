/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.WEB-DEMO
TAG: CLIENT.ENTRY
WHO = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
LICENSE: PROPRIETARY
*/
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
