class SoundManager {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private ringbackInterval: any = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];

  private initCtx() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => { /* ignore autoplay blocks */ });
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  /**
   * Start playing the dialing (ringback) tone.
   * Standard ringback tone: dual frequency 440Hz & 480Hz, 1.5s on, 3s off.
   */
  startRingback() {
    this.stopAll();
    this.initCtx();
    if (!this.ctx) return;

    const playRingback = () => {
      try {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now + 1.4);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);

        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);

        this.activeOscillators.push(osc1, osc2);
        this.activeGains.push(gainNode);
      } catch (err) {
        console.warn('Error playing ringback tone:', err);
      }
    };

    playRingback();
    this.ringbackInterval = setInterval(playRingback, 4500);
  }

  /**
   * Start playing the incoming ringtone.
   * Pleasant rhythmic tone: 853Hz & 960Hz dual tone in 2 short pulses, repeating every 3s.
   */
  startRingtone() {
    this.stopAll();
    this.initCtx();
    if (!this.ctx) return;

    const playRingtone = () => {
      try {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;

        const schedulePulse = (startTime: number, duration: number) => {
          if (!this.ctx) return;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gainNode = this.ctx.createGain();

          osc1.frequency.setValueAtTime(853, startTime);
          osc2.frequency.setValueAtTime(960, startTime);

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
          gainNode.gain.setValueAtTime(0.2, startTime + duration - 0.05);
          gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(this.ctx.destination);

          osc1.start(startTime);
          osc2.start(startTime);
          osc1.stop(startTime + duration);
          osc2.stop(startTime + duration);

          this.activeOscillators.push(osc1, osc2);
          this.activeGains.push(gainNode);
        };

        schedulePulse(now, 0.4);
        schedulePulse(now + 0.6, 0.4);
      } catch (err) {
        console.warn('Error playing ringtone:', err);
      }
    };

    playRingtone();
    this.ringtoneInterval = setInterval(playRingtone, 3000);
  }

  /**
   * Stop all active tones and clean up nodes.
   */
  stopAll() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }

    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped or not started
      }
    });
    this.activeOscillators = [];

    this.activeGains.forEach(gain => {
      try {
        gain.disconnect();
      } catch (e) {
        // Already disconnected
      }
    });
    this.activeGains = [];
  }
}

export const soundManager = new SoundManager();
