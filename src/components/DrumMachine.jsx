import { useCallback, useEffect, useRef, useState } from 'react';
import { DrumSynth } from '../audio/DrumSynth.js';
import { useDrumKeyboard } from '../hooks/useDrumKeyboard.js';
import { DrumPad } from './DrumPad.jsx';
import styles from './DrumMachine.module.css';

const PADS = [
  { id: 'kick', label: 'W', soundType: 'kick' },
  { id: 'snare', label: 'A', soundType: 'snare' },
  { id: 'hihat', label: 'S', soundType: 'hihat' },
  { id: 'tom', label: 'D', soundType: 'tom' },
  { id: 'crash', label: 'J', soundType: 'crash' },
  { id: 'clap', label: 'K', soundType: 'clap' },
  { id: 'cowbell', label: 'L', soundType: 'cowbell' },
];

export function DrumMachine() {
  const synthRef = useRef(null);
  const timersRef = useRef([]);
  const [activePads, setActivePads] = useState({});
  const [hitLog, setHitLog] = useState([]);

  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new DrumSynth();
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.destroy();
        synthRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      // Clear mọi timer để tránh cập nhật state sau khi unmount.
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current = [];
    };
  }, []);

  const handleTrigger = useCallback((soundType) => {
    synthRef.current?.play(soundType);

    setActivePads((prev) => ({
      ...prev,
      [soundType]: true,
    }));

    const timerId = setTimeout(() => {
      setActivePads((prev) => ({
        ...prev,
        [soundType]: false,
      }));

      timersRef.current = timersRef.current.filter(
        (id) => id !== timerId
      );
    }, 100);

    timersRef.current.push(timerId);

    setHitLog((prev) => [
      {
        id: crypto.randomUUID(),
        soundType,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ].slice(0, 10));
  }, []);

  useDrumKeyboard({
    onTrigger: handleTrigger,
    isEnabled: true,
  });

  const activeCount = Object.values(activePads).filter(Boolean).length;
  const meterLevel = Math.min(activeCount / PADS.length, 1) * 100;

  return (
    <section
      className={styles.container}
      aria-label="Drum Machine"
    >
      <header>
        <h2>Studio Drum Kit</h2>
        <p>Press W, A, S, D, J, K, L</p>
      </header>

      {/* Đã đổi div thành ul/li chuẩn semantic */}
      <ul className={styles.padGrid}>
        {PADS.map(({ id, label, soundType }) => (
          <li key={id}>
            <DrumPad
              id={id}
              label={label}
              soundType={soundType}
              isActive={Boolean(activePads[soundType])}
              onTrigger={handleTrigger}
            />
          </li>
        ))}
      </ul>

      {/* Đã đổi div + inline style thành thẻ <progress> chuẩn HTML5 */}
      <progress
        className={styles.meter}
        value={meterLevel}
        max="100"
        aria-label="Visual decibel meter"
        aria-hidden="true"
      />

      <output
        role="status"
        aria-live="polite"
        className={styles.hitLog}
      >
        Last hits:{' '}
        {hitLog.map((hit) => (
          <span key={hit.id}>
            {hit.soundType}{' '}
          </span>
        ))}
      </output>
    </section>
  );
}
