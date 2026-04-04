/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CLIENT.WEB-DEMO
TAG: CLIENT.APP.ROOT
WHO = LeeWay Industries | LeeWay Innovation | Creator: Leonard Lee
LICENSE: PROPRIETARY
*/
import styles from './App.module.css';
import { CommandCenter } from './CommandCenter';

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.logo}>⚡ LeeWay Edge RTC</span>
        <span className={styles.logoSub}>
          LeeWay Industries | LeeWay Innovation — Leonard Lee
        </span>
      </header>
      <main className={styles.main}>
        <CommandCenter />
      </main>
    </div>
  );
}
