/**
 * Routine Notification Sound Utility
 * Supports the uploaded Common Hawk-Cuckoo audio file as default,
 * along with Web Audio synth options (Chime, Bell) and Silent.
 */

export interface SoundOption {
  id: string;
  name: string;
  description: string;
}

export const NOTIFICATION_SOUNDS: SoundOption[] = [
  {
    id: 'common-hawk-cuckoo',
    name: 'Common Hawk-Cuckoo (Default)',
    description: 'Iconic South Asian bird call (চোখ গেল পাখি)',
  },
  {
    id: 'chime',
    name: 'Gentle Chime',
    description: 'Soft melodic chime',
  },
  {
    id: 'bell',
    name: 'Digital Bell',
    description: 'Modern two-tone notification bell',
  },
  {
    id: 'none',
    name: 'None (Silent / Vibrate only)',
    description: 'Displays notification without playing audio',
  },
];

let currentAudio: HTMLAudioElement | null = null;
let currentAudioContext: AudioContext | null = null;

/**
 * Check if the current environment is running as an installed PWA (Standalone mode)
 */
export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
  // iOS Safari check
  const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isStandaloneMatch || isIosStandalone;
}

/**
 * Check if Web Notification API is supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  return await Notification.requestPermission();
}

/**
 * Play synthesized chime via Web Audio API
 */
function playSynthChime(ctx: AudioContext) {
  const notes = [
    { freq: 1046.5, t: 0.0, dur: 1.2 },
    { freq: 1318.5, t: 0.12, dur: 1.2 },
    { freq: 1567.98, t: 0.24, dur: 1.3 },
    { freq: 2093.0, t: 0.36, dur: 1.4 },
  ];

  const now = ctx.currentTime;
  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.freq, now + n.t);

    gain.gain.setValueAtTime(0, now + n.t);
    gain.gain.linearRampToValueAtTime(0.25, now + n.t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.t);
    osc.stop(now + n.t + n.dur);
  }
}

/**
 * Play synthesized bell via Web Audio API
 */
function playSynthBell(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [
    { freq: 880, t: 0.0, dur: 0.6 },
    { freq: 1174.66, t: 0.18, dur: 0.9 },
  ];

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, now + n.t);

    gain.gain.setValueAtTime(0, now + n.t);
    gain.gain.linearRampToValueAtTime(0.35, now + n.t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.t);
    osc.stop(now + n.t + n.dur);
  }
}

/**
 * Play notification sound according to soundId
 */
export async function playNotificationSound(soundId: string = 'common-hawk-cuckoo'): Promise<void> {
  if (typeof window === 'undefined') return;
  if (soundId === 'none') return;

  stopNotificationSound();

  // 1. Synthesized sounds
  if (soundId === 'chime' || soundId === 'bell') {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        currentAudioContext = new AudioContextClass();
        if (currentAudioContext.state === 'suspended') {
          await currentAudioContext.resume();
        }
        if (soundId === 'chime') {
          playSynthChime(currentAudioContext);
        } else {
          playSynthBell(currentAudioContext);
        }
        return;
      }
    } catch (err) {
      console.warn('Web Audio playback failed, falling back:', err);
    }
  }

  // 2. Default: Common Hawk-Cuckoo audio file
  try {
    const audio = new Audio('/sounds/common-hawk-cuckoo.mp3');
    currentAudio = audio;
    audio.volume = 0.9;
    
    // Handle error fallback to .mpeg
    audio.onerror = () => {
      const fallbackAudio = new Audio('/sounds/common-hawk-cuckoo.mpeg');
      currentAudio = fallbackAudio;
      fallbackAudio.volume = 0.9;
      fallbackAudio.play().catch((e) => console.warn('Audio play failed:', e));
    };

    await audio.play();
  } catch (err) {
    console.warn('Failed to play notification audio:', err);
  }
}

/**
 * Stop any currently playing notification audio
 */
export function stopNotificationSound(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentAudioContext && currentAudioContext.state !== 'closed') {
    try {
      currentAudioContext.close();
    } catch {
      // Ignore
    }
    currentAudioContext = null;
  }
}
