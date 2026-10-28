import { memo } from 'react';
import styles from './DrumPad.module.css';

export const DrumPad = memo(function DrumPad({
  id,
  label,
  soundType,
  isActive,
  onTrigger,
}) {
  return (
    <button
      type="button"
      className={`${styles.pad} ${isActive ? styles.active : ''}`}
      aria-pressed={isActive}
      onClick={() => onTrigger(soundType)}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.sound}>{soundType}</span>
    </button>
  );
});
