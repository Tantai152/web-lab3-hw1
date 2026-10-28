export class DrumSynth {
  constructor() {
    // Lazy initialization: tạo AudioContext sau user gesture.
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new window.AudioContext();
    }

    if (this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }

    return Promise.resolve();
  }

  play(soundType) {
    this.init();

    switch (soundType) {
      case 'kick':
        this._playKick();
        break;
      case 'snare':
        this._playSnare();
        break;
      case 'hihat':
        this._playHihat();
        break;
      case 'tom':
        this._playTom();
        break;
      case 'crash':
        this._playCrash();
        break;
      case 'clap':
        this._playClap();
        break;
      case 'cowbell':
        this._playCowbell();
        break;
      default:
        break;
    }
  }

  _createNoiseBuffer(duration) {
    const sampleRate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(
      1,
      Math.floor(sampleRate * duration),
      sampleRate
    );
    const data = buffer.getChannelData(0);

    // White noise: mẫu ngẫu nhiên trong khoảng -1 đến 1.
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  _cleanup(nodes, source, endTime) {
    const ctx = this.ctx;

    // Dọn node sau khi envelope kết thúc.
    const cleanup = () => {
      source.onended = null;
      nodes.forEach((node) => node.disconnect());
    };

    source.onended = cleanup;
    source.stop(endTime);
  }

  _playKick() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pitch drop 150Hz -> 0.01Hz trong 0.5s tạo tiếng kick sâu.
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Gain giảm nhanh để tạo transient mạnh.
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    this._cleanup([osc, gain], osc, now + 0.51);
  }

  _playSnare() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    noise.buffer = this._createNoiseBuffer(0.25);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500, now);

    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Triangle oscillator 150Hz bổ sung phần thân tiếng snare.
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(now);
    osc.start(now);
    this._cleanup([filter, noiseGain], noise, now + 0.21);
    this._cleanup([oscGain], osc, now + 0.16);
  }

  _playHihat() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    noise.buffer = this._createNoiseBuffer(0.08);
    filter.type = 'highpass';
    // Cắt dưới 7000Hz để tạo tiếng hi-hat sáng.
    filter.frequency.setValueAtTime(7000, now);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    this._cleanup([filter, gain], noise, now + 0.06);
  }

  _playTom() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pitch drop 200Hz -> 50Hz trong 0.3s tạo tiếng tom trầm.
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    this._cleanup([gain], osc, now + 0.31);
  }

  _playCrash() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    noise.buffer = this._createNoiseBuffer(1.1);
    filter.type = 'bandpass';
    // Bandpass 5000Hz nhấn mạnh dải tần kim loại của crash.
    filter.frequency.setValueAtTime(5000, now);
    filter.Q.setValueAtTime(0.7, now);

    // Decay dài 1s mô phỏng tiếng cymbal ngân.
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    this._cleanup([filter, gain], noise, now + 1.01);
  }

  _playClap() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    noise.buffer = this._createNoiseBuffer(0.2);
    filter.type = 'bandpass';
    // Bandpass 1200Hz tạo tiếng clap sắc nét, punchy.
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1, now);

    // Decay ngắn 0.15s tạo tiếng clap ngắn gọn.
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    this._cleanup([filter, gain], noise, now + 0.16);
  }

  _playCowbell() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(540, now);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, now);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    gain2.gain.setValueAtTime(0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(2, now);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    this._cleanup([gain1, gain2, filter], osc1, now + 0.41);
    this._cleanup([], osc2, now + 0.41);
  }

  destroy() {
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;

      if (ctx.state !== 'closed') {
        return ctx.close();
      }
    }

    return Promise.resolve();
  }
}
