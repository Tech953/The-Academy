type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface JingleNote {
  frequency: number;
  duration: number;
  delay: number;
  type: OscillatorType;
  gain: number;
  attack?: number;
  decay?: number;
  detune?: number;
}

const noteFrequencies: { [key: string]: number } = {
  'B1': 61.74,
  'E4': 329.63,
  'F#4': 369.99,
  'E5': 659.25,
  'G5': 783.99,
  'C6': 1046.50,
};

let audioContext: AudioContext | null = null;
let isPlaying = false;
let audioInitialized = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function initializeAudio(): void {
  if (audioInitialized) return;
  
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    audioInitialized = true;
  } catch (error) {
    console.warn('Audio initialization failed:', error);
  }
}

function setupAutoplayHandler(): void {
  const handler = () => {
    initializeAudio();
    document.removeEventListener('click', handler);
    document.removeEventListener('keydown', handler);
    document.removeEventListener('touchstart', handler);
  };
  
  document.addEventListener('click', handler, { once: true });
  document.addEventListener('keydown', handler, { once: true });
  document.addEventListener('touchstart', handler, { once: true });
}

if (typeof window !== 'undefined') {
  setupAutoplayHandler();
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  
  return buffer;
}

function playMotherReactorHum(ctx: AudioContext, startTime: number): void {
  const duration = 2.8;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc1.type = 'sawtooth';
  osc1.frequency.value = 45;
  
  osc2.type = 'sine';
  osc2.frequency.value = 90;
  osc2.detune.value = -10;
  
  osc3.type = 'triangle';
  osc3.frequency.value = 135;
  osc3.detune.value = 5;
  
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  filter.Q.value = 2;
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.3);
  gainNode.gain.setValueAtTime(0.08, startTime + duration - 0.5);
  gainNode.gain.linearRampToValueAtTime(0.04, startTime + duration - 0.2);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  
  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
  osc3.stop(startTime + duration);
}

function playRelayClicks(ctx: AudioContext, startTime: number): void {
  const clickTimes = [0, 0.12, 0.35, 0.42, 0.68, 0.95, 1.15, 1.45, 1.72];
  
  clickTimes.forEach(delay => {
    const noiseBuffer = createNoiseBuffer(ctx, 0.025);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'highpass';
    filter.frequency.value = 2500 + Math.random() * 1500;
    filter.Q.value = 3;
    
    const clickStart = startTime + delay;
    const clickVolume = 0.04 + Math.random() * 0.03;
    
    gainNode.gain.setValueAtTime(0, clickStart);
    gainNode.gain.linearRampToValueAtTime(clickVolume, clickStart + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.001, clickStart + 0.02);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noiseSource.start(clickStart);
    noiseSource.stop(clickStart + 0.025);
  });
}

function playDataBleeps(ctx: AudioContext, startTime: number): void {
  const bleepPattern = [
    { freq: 1200, delay: 0, duration: 0.06 },
    { freq: 1400, delay: 0.15, duration: 0.04 },
    { freq: 1200, delay: 0.25, duration: 0.06 },
    { freq: 1000, delay: 0.38, duration: 0.08 },
    { freq: 1400, delay: 0.55, duration: 0.04 },
    { freq: 1200, delay: 0.65, duration: 0.04 },
    { freq: 1600, delay: 0.78, duration: 0.06 },
    { freq: 1200, delay: 0.92, duration: 0.08 },
    { freq: 1400, delay: 1.10, duration: 0.04 },
    { freq: 1000, delay: 1.22, duration: 0.06 },
    { freq: 1600, delay: 1.38, duration: 0.04 },
    { freq: 1200, delay: 1.52, duration: 0.08 },
  ];
  
  bleepPattern.forEach(bleep => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = bleep.freq;
    
    const bleepStart = startTime + bleep.delay;
    gainNode.gain.setValueAtTime(0, bleepStart);
    gainNode.gain.linearRampToValueAtTime(0.035, bleepStart + 0.005);
    gainNode.gain.setValueAtTime(0.035, bleepStart + bleep.duration - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, bleepStart + bleep.duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(bleepStart);
    osc.stop(bleepStart + bleep.duration);
  });
}

function playTapeDriveSpinup(ctx: AudioContext, startTime: number): void {
  const duration = 0.8;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, startTime);
  osc.frequency.exponentialRampToValueAtTime(320, startTime + 0.4);
  osc.frequency.setValueAtTime(320, startTime + 0.6);
  osc.frequency.exponentialRampToValueAtTime(280, startTime + duration);
  
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  filter.Q.value = 1.5;
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.04, startTime + 0.1);
  gainNode.gain.setValueAtTime(0.04, startTime + 0.6);
  gainNode.gain.linearRampToValueAtTime(0.02, startTime + duration);
  
  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
  
  const noiseBuffer = createNoiseBuffer(ctx, duration);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 3000;
  noiseFilter.Q.value = 2;
  
  noiseGain.gain.setValueAtTime(0, startTime);
  noiseGain.gain.linearRampToValueAtTime(0.015, startTime + 0.2);
  noiseGain.gain.setValueAtTime(0.015, startTime + 0.6);
  noiseGain.gain.linearRampToValueAtTime(0.008, startTime + duration);
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  noiseSource.start(startTime);
  noiseSource.stop(startTime + duration);
}

function playMotherVoiceProcessing(ctx: AudioContext, startTime: number): void {
  const duration = 0.6;
  
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modulatorGain = ctx.createGain();
  const carrierGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  carrier.type = 'triangle';
  carrier.frequency.value = 280;
  carrier.frequency.setValueAtTime(280, startTime);
  carrier.frequency.linearRampToValueAtTime(320, startTime + 0.15);
  carrier.frequency.linearRampToValueAtTime(260, startTime + 0.35);
  carrier.frequency.linearRampToValueAtTime(300, startTime + duration);
  
  modulator.type = 'sine';
  modulator.frequency.value = 8;
  modulatorGain.gain.value = 30;
  
  modulator.connect(modulatorGain);
  modulatorGain.connect(carrier.frequency);
  
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 3;
  
  carrierGain.gain.setValueAtTime(0, startTime);
  carrierGain.gain.linearRampToValueAtTime(0.06, startTime + 0.05);
  carrierGain.gain.setValueAtTime(0.06, startTime + duration - 0.15);
  carrierGain.gain.linearRampToValueAtTime(0, startTime + duration);
  
  carrier.connect(filter);
  filter.connect(carrierGain);
  carrierGain.connect(ctx.destination);
  
  carrier.start(startTime);
  carrier.stop(startTime + duration);
  modulator.start(startTime);
  modulator.stop(startTime + duration);
}

function playDistressBeacon(ctx: AudioContext, startTime: number): void {
  const beaconPattern = [0, 0.4, 0.8];
  
  beaconPattern.forEach(delay => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, startTime + delay);
    osc.frequency.linearRampToValueAtTime(660, startTime + delay + 0.25);
    
    gainNode.gain.setValueAtTime(0, startTime + delay);
    gainNode.gain.linearRampToValueAtTime(0.05, startTime + delay + 0.02);
    gainNode.gain.setValueAtTime(0.05, startTime + delay + 0.18);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + delay + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(startTime + delay);
    osc.stop(startTime + delay + 0.3);
  });
}

function playCRTStatic(ctx: AudioContext, startTime: number): void {
  const noiseBuffer = createNoiseBuffer(ctx, 0.25);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 2000;
  noiseFilter.Q.value = 1;
  
  noiseGain.gain.setValueAtTime(0, startTime);
  noiseGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
  noiseGain.gain.linearRampToValueAtTime(0, startTime + 0.25);
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  noiseSource.start(startTime);
  noiseSource.stop(startTime + 0.25);
}

function playSystemChime(ctx: AudioContext, startTime: number): void {
  const notes: JingleNote[] = [
    { frequency: noteFrequencies['E4'], duration: 0.08, delay: 0, type: 'sine', gain: 0.25, attack: 0.01 },
    { frequency: noteFrequencies['F#4'], duration: 0.08, delay: 0.08, type: 'sine', gain: 0.22, attack: 0.01 },
    { frequency: noteFrequencies['E5'], duration: 0.12, delay: 0.16, type: 'sine', gain: 0.3, attack: 0.01, decay: 0.08 },
  ];
  
  notes.forEach(note => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const distortion = ctx.createWaveShaper();
    
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 1.5);
    }
    distortion.curve = curve;
    
    osc.type = note.type;
    osc.frequency.value = note.frequency;
    
    const noteStart = startTime + note.delay;
    gainNode.gain.setValueAtTime(0, noteStart);
    gainNode.gain.linearRampToValueAtTime(note.gain, noteStart + (note.attack || 0.01));
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + note.duration);
    
    osc.connect(distortion);
    distortion.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(noteStart);
    osc.stop(noteStart + note.duration + 0.05);
  });
}

function playCyberDrone(ctx: AudioContext, startTime: number): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const distortion = ctx.createWaveShaper();
  
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(x * 0.5);
  }
  distortion.curve = curve;
  
  osc.type = 'sawtooth';
  osc.frequency.value = noteFrequencies['B1'];
  
  lfo.type = 'sine';
  lfo.frequency.value = 5;
  lfoGain.gain.value = 0.05;
  
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain);
  
  const droneDuration = 0.75;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.08);
  gainNode.gain.setValueAtTime(0.12, startTime + droneDuration * 0.6);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + droneDuration);
  
  osc.connect(distortion);
  distortion.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + droneDuration);
  lfo.start(startTime);
  lfo.stop(startTime + droneDuration);
}

function playResonancePulse(ctx: AudioContext, startTime: number): void {
  const pulseDuration = 0.2;
  
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modulatorGain = ctx.createGain();
  const carrierGain = ctx.createGain();
  const delay = ctx.createDelay();
  const delayGain = ctx.createGain();
  
  carrier.type = 'sine';
  carrier.frequency.value = noteFrequencies['C6'];
  
  modulator.type = 'sine';
  modulator.frequency.value = noteFrequencies['G5'] * 2;
  modulatorGain.gain.value = 200;
  
  modulator.connect(modulatorGain);
  modulatorGain.connect(carrier.frequency);
  
  delay.delayTime.value = 0.06;
  delayGain.gain.value = 0.25;
  
  carrierGain.gain.setValueAtTime(0, startTime);
  carrierGain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
  carrierGain.gain.setValueAtTime(0.12, startTime + 0.08);
  carrierGain.gain.exponentialRampToValueAtTime(0.01, startTime + pulseDuration);
  
  carrier.connect(carrierGain);
  carrierGain.connect(ctx.destination);
  carrierGain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(ctx.destination);
  
  carrier.start(startTime);
  carrier.stop(startTime + pulseDuration);
  modulator.start(startTime);
  modulator.stop(startTime + pulseDuration);
}

function playRotatingDataScroll(ctx: AudioContext, startTime: number): void {
  const duration = 2.4;
  const rotationSpeed = 12;
  
  const baseOsc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const mainGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  baseOsc.type = 'sawtooth';
  baseOsc.frequency.value = 120;
  
  lfo.type = 'sine';
  lfo.frequency.value = rotationSpeed;
  lfoGain.gain.value = 40;
  
  lfo.connect(lfoGain);
  lfoGain.connect(baseOsc.frequency);
  
  filter.type = 'bandpass';
  filter.frequency.value = 300;
  filter.Q.value = 2;
  
  mainGain.gain.setValueAtTime(0, startTime);
  mainGain.gain.linearRampToValueAtTime(0.06, startTime + 0.15);
  mainGain.gain.setValueAtTime(0.06, startTime + duration - 0.3);
  mainGain.gain.linearRampToValueAtTime(0, startTime + duration);
  
  baseOsc.connect(filter);
  filter.connect(mainGain);
  mainGain.connect(ctx.destination);
  
  baseOsc.start(startTime);
  lfo.start(startTime);
  baseOsc.stop(startTime + duration);
  lfo.stop(startTime + duration);
  
  const clickRate = 24;
  const clickCount = Math.floor(duration * clickRate);
  
  for (let i = 0; i < clickCount; i++) {
    const clickTime = startTime + (i / clickRate);
    const intensity = 0.5 + 0.5 * Math.sin(i * 0.3);
    
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();
    
    clickOsc.type = 'square';
    clickOsc.frequency.value = 2000 + Math.random() * 1000;
    
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 3000;
    
    const clickVol = 0.008 * intensity;
    clickGain.gain.setValueAtTime(0, clickTime);
    clickGain.gain.linearRampToValueAtTime(clickVol, clickTime + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.015);
    
    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);
    
    clickOsc.start(clickTime);
    clickOsc.stop(clickTime + 0.015);
  }
  
  const seekCount = 6;
  const seekTimes = [0.3, 0.7, 1.1, 1.5, 1.85, 2.1];
  
  seekTimes.forEach(delay => {
    const seekTime = startTime + delay;
    
    const seekOsc = ctx.createOscillator();
    const seekGain = ctx.createGain();
    
    seekOsc.type = 'sawtooth';
    const startFreq = 150 + Math.random() * 100;
    const endFreq = 80 + Math.random() * 60;
    seekOsc.frequency.setValueAtTime(startFreq, seekTime);
    seekOsc.frequency.exponentialRampToValueAtTime(endFreq, seekTime + 0.08);
    
    seekGain.gain.setValueAtTime(0, seekTime);
    seekGain.gain.linearRampToValueAtTime(0.03, seekTime + 0.01);
    seekGain.gain.exponentialRampToValueAtTime(0.001, seekTime + 0.1);
    
    seekOsc.connect(seekGain);
    seekGain.connect(ctx.destination);
    
    seekOsc.start(seekTime);
    seekOsc.stop(seekTime + 0.1);
  });
}

function playCubChirp(ctx: AudioContext, startTime: number): void {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode1 = ctx.createGain();
  const gainNode2 = ctx.createGain();
  
  osc1.type = 'square';
  osc1.frequency.value = 1200;
  osc1.frequency.setValueAtTime(1200, startTime);
  osc1.frequency.linearRampToValueAtTime(1400, startTime + 0.03);
  
  osc2.type = 'square';
  osc2.frequency.value = 1600;
  osc2.frequency.setValueAtTime(1600, startTime + 0.08);
  osc2.frequency.linearRampToValueAtTime(1800, startTime + 0.12);
  
  gainNode1.gain.setValueAtTime(0, startTime);
  gainNode1.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
  gainNode1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.06);
  
  gainNode2.gain.setValueAtTime(0, startTime + 0.08);
  gainNode2.gain.linearRampToValueAtTime(0.06, startTime + 0.09);
  gainNode2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.14);
  
  osc1.connect(gainNode1);
  gainNode1.connect(ctx.destination);
  osc2.connect(gainNode2);
  gainNode2.connect(ctx.destination);
  
  osc1.start(startTime);
  osc1.stop(startTime + 0.06);
  osc2.start(startTime + 0.08);
  osc2.stop(startTime + 0.14);
}

export async function playBootJingle(): Promise<void> {
  if (isPlaying) return;
  
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    isPlaying = true;
    const now = ctx.currentTime;
    
    playMotherReactorHum(ctx, now);
    playRotatingDataScroll(ctx, now + 0.1);
    playRelayClicks(ctx, now + 0.15);
    playTapeDriveSpinup(ctx, now + 0.25);
    playDataBleeps(ctx, now + 0.5);
    playMotherVoiceProcessing(ctx, now + 1.2);
    playCRTStatic(ctx, now + 1.8);
    playDistressBeacon(ctx, now + 2.0);
    playSystemChime(ctx, now + 2.5);
    playCubChirp(ctx, now + 2.9);
    
    setTimeout(() => {
      isPlaying = false;
    }, 3500);
    
  } catch (error) {
    console.warn('Boot jingle failed to play:', error);
    isPlaying = false;
  }
}

export function stopBootJingle(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  isPlaying = false;
}

export function playIconAppearSound(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 440 + Math.random() * 200;
    
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (error) {
    console.warn('Icon sound failed:', error);
  }
}

export function playLoadingTick(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = 800 + Math.random() * 400;
    
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.02, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.03);
  } catch (error) {
  }
}

export function playSystemReady(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') return;
    
    const now = ctx.currentTime;
    
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const noteStart = now + i * 0.08;
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(0.1, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(noteStart);
      osc.stop(noteStart + 0.15);
    });
  } catch (error) {
    console.warn('System ready sound failed:', error);
  }
}
