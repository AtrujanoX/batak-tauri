import React, { useEffect, useRef, useState } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { appDataDir, join } from '@tauri-apps/api/path';
import { writeFile, mkdir } from '@tauri-apps/plugin-fs';
import './App.css';

export default function App() {
  const [page, setPage] = useState(1);
  const videoRef = useRef(null);
  const [useVideoAtStart, setUseVideoAtStart] = useState(true);
  const [videoFileUrl, setVideoFileUrl] = useState('assets/video.mp4');
  const [wallDefaultUrl, setWallDefaultUrl] = useState('assets/wallpaper_default.jpg');
  const [wallPage2Url, setWallPage2Url] = useState('assets/wallpaper_page2.jpg');
  const [gameDuration, setGameDuration] = useState(() => {
    const v = localStorage.getItem('gameDuration');
    return v ? parseInt(v, 10) : 30;
  });
  const [countdownText, setCountdownText] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [score, setScore] = useState(0);
  const timerCircleRef = useRef<SVGCircleElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const inactivityRef = useRef<number | null>(null);
  const [portName, setPortName] = useState('/dev/ttyUSB0');
  const [connected, setConnected] = useState(false);
  const [lastMsg, setLastMsg] = useState('Esperando datos...');
  const [log, setLog] = useState<string[]>([]);
  const [setBtValue, setSetBtValue] = useState(4);
  const serialListenerRef = useRef(null as unknown as UnlistenFn | null);

  useEffect(() => {
    (async () => {
      const storedVideoPath = localStorage.getItem('videoDefault');
      const storedWallpaperPath = localStorage.getItem('wallDefault');
      const storedWallpaper2Path = localStorage.getItem('wallPage2');
      if (storedVideoPath) {
        setVideoFileUrl(convertFileSrc(storedVideoPath));
        setUseVideoAtStart(true);
      } else if (storedWallpaperPath) {
        setWallDefaultUrl(convertFileSrc(storedWallpaperPath));
      }
      if (storedWallpaper2Path) setWallPage2Url(convertFileSrc(storedWallpaper2Path));
    })();
  }, []);

  useEffect(() => {

    const reset = () => {
      clearTimeout(inactivityRef.current as any);
      inactivityRef.current = setTimeout(() => setPage(1), 30000);
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    reset();
    return () => {
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
      clearTimeout(inactivityRef.current as any);
    };
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    (async () => {
      try {
        unlisten = await listen('serial-data', (event) => {
          const payload = String(event.payload);
          setLastMsg(payload);
          setLog((s) => [new Date().toLocaleTimeString() + ' ' + payload, ...s].slice(0, 200));
          const m = payload.match(/res=(\d),(\d+)/i);
          if (m) {
            const estado = parseInt(m[1], 10);
            if (estado === 1) setScore((p) => p + 1);
            clearTimeout(inactivityRef.current as any);
            inactivityRef.current = setTimeout(() => setPage(1), 30000);
          }
        });
        serialListenerRef.current = unlisten;
      } catch (e) {
        console.warn('listen failed', e);
      }
    })();
    return () => {
      if (serialListenerRef.current) serialListenerRef.current();
      unlisten = null;
    };
  }, []);

  async function connectSerial() {
    try {
      await invoke('connect_serial', { portName });
      setConnected(true);
      setLog((s) => [`Connected ${portName}`, ...s]);
      sendCommand('SETBT=4');
    } catch (e) {
      setLog((s) => [`Error connect: ${String(e)}`, ...s]);
    }
  }

  async function disconnectSerial() {
    try {
      await invoke('disconnect_serial');
      setConnected(false);
      setLog((s) => [`Disconnected ${portName}`, ...s]);
    } catch (e) {
      setLog((s) => [`Error disconnect: ${String(e)}`, ...s]);
    }
  }

  async function sendCommand(cmd: string) {
    try {
      await invoke('send_command', { command: cmd });
      setLog((s) => [`> ${cmd}`, ...s]);
    } catch (e) {
      setLog((s) => [`Error send: ${String(e)}`, ...s]);
    }
  }

  const onStart = () => sendCommand('START');
  const onStop = () => sendCommand('STOP');
  const onSweep = () => sendCommand('SWEEP');
  const onSetBT = () => sendCommand(`SETBT=${Number(setBtValue)}`);

  const runCountdown = (durationSeconds: number) => {
    setScore(0);
    setShowStartButton(false);
    setShowCountdown(true);
    const nums = [3, 2, 1, 0];
    let i = 0;
    const iv = setInterval(() => {
      setCountdownText(String(nums[i]));
      if (i === nums.length - 1) {
        clearInterval(iv);
        sendCommand('START');
        setShowCountdown(false);
        startGameTimer(durationSeconds);
      }
      i++;
    }, 1000);
  };

  const startGameTimer = (seconds: number) => {
    setShowTimer(true);
    // Timer logic now handled in useEffect
    timerIntervalRef.current = null;
    // Store duration in a ref for useEffect
    timerDurationRef.current = seconds;
  };
  // Ref to store timer duration for useEffect
  const timerDurationRef = useRef<number>(0);

  useEffect(() => {
    if (showTimer && timerDurationRef.current > 0) {
      const circle = timerCircleRef.current as SVGCircleElement | null;
      if (!circle) return;
      const seconds = timerDurationRef.current;
      const r = circle.r.baseVal.value;
      const circ = 2 * Math.PI * r;
      circle.style.strokeDasharray = String(circ);
      circle.style.strokeDashoffset = '0';

      let elapsed = 0;
      const interval = 5;
      const total = (seconds * 1000) / interval;
      timerIntervalRef.current = window.setInterval(() => {
        elapsed++;
        const offset = circ * (elapsed / total);
        circle.style.strokeDashoffset = String(offset);
        if (elapsed >= total) {
          clearInterval(timerIntervalRef.current as number);
          setShowTimer(false);
          sendCommand('STOP');
          setPage(3);
        }
      }, interval);
      // Cleanup on unmount or when showTimer goes false
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current as number);
        }
      };
    }
  }, [showTimer]);

  async function saveToUserAssets(file: File, baseName: string): Promise<{ path: string; url: string; }> {
    const baseDir = await appDataDir();
    const destDir = await join(baseDir, 'user-assets');
    await mkdir(destDir, { recursive: true });
    const ext = (() => {
      const p = file.name.lastIndexOf('.');
      return p >= 0 ? file.name.slice(p + 1) : 'bin';
    })();
    const destPath = await join(destDir, `${baseName}.${ext}`);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(destPath, bytes);
    return { path: destPath, url: convertFileSrc(destPath) };
  }

  async function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const { path, url } = await saveToUserAssets(f, 'video');
    setVideoFileUrl(url);
    localStorage.setItem('videoDefault', path);
    setUseVideoAtStart(true);
  }
  async function onWallDefaultFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const { path, url } = await saveToUserAssets(f, 'wallpaper_default');
    setWallDefaultUrl(url);
    localStorage.setItem('wallDefault', path);
  }
  async function onWallPage2File(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const { path, url } = await saveToUserAssets(f, 'wallpaper_page2');
    setWallPage2Url(url);
    localStorage.setItem('wallPage2', path);
  }

  function applyOptions() {
    localStorage.setItem('gameDuration', String(gameDuration));
    setOptionsOpen(false);
    alert('Cambios aplicados ✅');
  }

  useEffect(() => {
    if (videoRef.current && videoFileUrl) {
      try { (videoRef.current as HTMLVideoElement).play(); } catch { }
    }
  }, [videoFileUrl]);

  function resetGame() {
    setScore(0);
    setShowStartButton(true);
    setShowCountdown(false);
    setShowTimer(false);
    setPage(2);
  }

  return (
    <div className="app-container">
      {/* Page 1 */}
      <div className={`page ${page === 1 ? 'active' : ''}`} onClick={() => setPage(2)}>
        {useVideoAtStart && videoFileUrl ? (
          <video ref={videoRef} src={videoFileUrl} autoPlay loop muted playsInline className="full-bg" />
        ) : (
          <img src={wallDefaultUrl || 'assets/wallpaper_default.jpg'} alt="wall" className="full-bg" />
        )}
        <button className="mute-btn" onClick={(e) => { e.stopPropagation(); const v = videoRef.current as HTMLVideoElement | null; if (v) { v.muted = !v.muted; } }}>🔇</button>
      </div>

      {/* Page 2 */}
      <div className={`page ${page === 2 ? 'active' : ''}`} style={{ backgroundImage: `url(${wallPage2Url || 'assets/wallpaper_page2.jpg'})` }}>
        <div className="game-container">
          {showStartButton && <button id="playBtn" onClick={() => runCountdown(gameDuration)} className="play-btn">JUGAR</button>}
          {showCountdown && <div className="countdown">{countdownText}</div>}
          {showTimer && (
            <div className="timer-wrapper">
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="timer-bg" id='timerWrapper'>
                <circle cx="50" cy="50" r="45" stroke="#ddd" fill="transparent" strokeWidth="8%" />
              </svg>
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="timer-overlay" id='timerWrapper'>
                <circle ref={timerCircleRef} id="timerCircle" cx="50" cy="50" r="45" stroke="#FF5722" fill="transparent" transform="rotate(-90 50 50)" strokeWidth="6%" />
              </svg>
              <div className="score-display" id="score">{String(score).padStart(2, '0')}</div>
            </div>
          )}
        </div>

        <button className="options-btn" onClick={() => setOptionsOpen((s) => !s)}>⚙️</button>

        {optionsOpen && (
          <div className="options-menu">
            <label>
              <input type="checkbox" checked={useVideoAtStart} onChange={(e) => setUseVideoAtStart(e.target.checked)} /> USAR VIDEO INICIAL<input type="file" accept="video/*" onChange={onVideoFile} />
            </label>
            <label>
              <input type="checkbox" checked={!useVideoAtStart} onChange={(e) => setUseVideoAtStart(!e.target.checked)} /> USAR WALLPAPER INICIAL<input type="file" accept="image/*" onChange={onWallDefaultFile} />
            </label>
            <label>CAMBIAR WALLPAPER 2<input type="file" accept="image/*" onChange={onWallPage2File} /></label>
            <label>DURACION (SEGUNDOS)<input type="number" min={5} max={300} value={gameDuration} onChange={(e) => setGameDuration(Number(e.target.value))} /></label>
            <button onClick={applyOptions}>APLICAR CAMBIOS</button>
            <div className="serial-controls">
              <input value={portName} onChange={(e) => setPortName(e.target.value)} />
              <button onClick={connectSerial}>{connected ? 'CONECTADO' : 'CONECTAR'}</button>
              <button onClick={disconnectSerial}>DESCONECTAR</button>
              <button onClick={onStart}>START</button>
              <button onClick={onStop}>STOP</button>
              <button onClick={onSweep}>SWEEP</button>
              <button onClick={onSetBT}>BOTONES</button>
              <input type="number" value={setBtValue} onChange={(e) => setSetBtValue(Number(e.target.value))} />
            </div>

          </div>
        )}


        <div className="serial-log">
          <div className="log-title">Último mensaje</div>
          <div>{lastMsg}</div>
          <div className="log-title">Historial</div>
          <pre>{log.join('\n')}</pre>
        </div>

      </div>

      {/* Page 3: final */}
      <div className={`page ${page === 3 ? 'active' : ''}`} style={{ backgroundImage: `url(${wallPage2Url || 'assets/wallpaper_page2.jpg'})` }}>
        <div className="final-overlay">
          <div className="final-label">TIEMPO !!!</div>
          <div className="final-score">{String(score).padStart(2, '0')}</div>
          <button className="replay-btn" onClick={() => resetGame()}>VOLVER A JUGAR</button>
        </div>
      </div>
    </div>
  );
}
