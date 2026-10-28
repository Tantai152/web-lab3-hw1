import { useEffect } from 'react';

export function useDrumKeyboard({ onTrigger, isEnabled = true }) {
  useEffect(() => {
    if (isEnabled === false) return;

    const keyMap = {
      KeyW: 'kick',
      KeyA: 'snare',
      KeyS: 'hihat',
      KeyD: 'tom',
      KeyJ: 'crash',
      KeyK: 'clap',
      KeyL: 'cowbell',
    };

    const handler = (e) => {
      // Guard 1: Chặn OS key-hold spam khi giữ phím.
      if (e.repeat) return;

      // Guard 2: Không bắt phím khi người dùng nhập liệu.
      const tag = e.target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Chỉ sử dụng e.code để xác định phím vật lý.
      const soundType = keyMap[e.code];

      if (soundType) {
        e.preventDefault();
        onTrigger(soundType);
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [onTrigger, isEnabled]);
}
