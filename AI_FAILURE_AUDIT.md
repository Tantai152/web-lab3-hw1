# AI FAILURE MODE AUDIT — Production Studio Drum Kit

## Overview

Audit common errors when using AI to generate React 19 code for Web Audio API and Keyboard Events.

## Vulnerability 01: Deprecated `keyCode` & Missing Input Guard

**AI Prompt used:**

"Add keyboard listeners to trigger drum pads"

**AI Generated Code (Error):**

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.keyCode === 87) playKick(); // W
    if (e.keyCode === 65) playSnare(); // A
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Risk:**

CWE-1104. `e.keyCode` is deprecated and inaccurate for non-US-QWERTY keyboards or when using IME (UniKey). Additionally, missing input isolation causes typing "W" in a search box to trigger drum sound.

**Detection Method:**

Enable UniKey to type Vietnamese, press the W key (types "ư") -> drum still sounds. Or focus on any `<input>` tag, press a key -> drum sounds.

**Engineering Refactor:**

```javascript
const handler = (e) => {
  if (e.repeat) return; // Guard spam
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return; // Guard input
  if (e.code === 'KeyW') playKick(); // W3C standard
};
window.addEventListener('keydown', handler);
```

**Verification:**

DevTools: Typing in input no longer produces drum sound. Pressing W key with UniKey no longer triggers false positive.

## Vulnerability 02: Memory Leak from AudioContext

**AI Prompt used:**

"Create a drum synth class and use it in a React component"

**AI Generated Code (Error):**

```javascript
// In component
const synth = new DrumSynth(); // Initialize directly on every re-render

useEffect(() => {
  // No cleanup
}, []);
```

**Risk:**

CWE-401 (Memory Leak). Every time the component re-renders, a new AudioContext is created. Browser limits the number of AudioContexts (usually 6). If exceeded, sound freezes or crashes completely. Additionally, when the component unmounts, old audio nodes keep running, causing memory leak.

**Detection Method:**

React DevTools -> Profiler -> Press keys continuously. Open Chrome Task Manager (Shift + Esc) to see Memory increasing continuously without decreasing.

**Engineering Refactor:**

```javascript
const synthRef = useRef(null);

useEffect(() => {
  if (!synthRef.current) synthRef.current = new DrumSynth();
  return () => {
    synthRef.current?.destroy(); // ctx.close()
  };
}, []);
```

**Verification:**

Use React StrictMode (mount/unmount 2 times), Console does not report too many AudioContext errors. Task Manager memory remains stable.

## Vulnerability 03: Unclean setTimeout (Stale State & Memory Leak)

**AI Prompt used:**

"Flash the pad red when active for 100ms"

**AI Generated Code (Error):**

```javascript
const handleTrigger = () => {
  setActive(true);
  setTimeout(() => setActive(false), 100); // No ID saved to clear
};
```

**Risk:**

CWE-362 (Race Condition). If the user presses keys quickly and continuously (spam), many setTimeouts queue up. When the component unmounts, these timers still run and call setActive on a dead component -> React warning, memory leak. Additionally, a race condition can occur: pad turns off before it even turns on.

**Detection Method:**

Press keys extremely fast 10 times, then navigate away (unmount). Console shows warning "Can't perform a React state update on an unmounted component".

**Engineering Refactor:**

```javascript
const timersRef = useRef([]);

// Trigger
const timerId = setTimeout(() => setActive(false), 100);
timersRef.current.push(timerId);

// Cleanup
useEffect(() => {
  return () => {
    timersRef.current.forEach(clearTimeout);
  };
}, []);
```

**Verification:**

Spam keys then unmount, Console is clean without warning. Pad lights on/off correctly on beat.

## Summary Table

| # | Vulnerability | CWE | Severity | Fixed |
|---|---|---|---|---|
| 01 | keyCode & missing input guard | CWE-1104 | High | Yes |
| 02 | AudioContext Memory Leak | CWE-401 | Critical | Yes |
| 03 | Unclean setTimeout Race | CWE-362 | Medium | Yes |
