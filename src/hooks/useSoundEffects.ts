/**
 * useSoundEffects — Web Audio API based sound synthesis.
 *
 * All sounds are generated programmatically — no external audio files needed.
 * Respects a mute flag from the store via getMuted callback.
 */

import { useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

type Wave = OscillatorType;

interface NoteOpts {
  freq: number;
  durationMs: number;
  type?: Wave;
  gain?: number;
  startDelay?: number;
  /** Fade ratio of duration spent fading in/out. */
  attack?: number;
  release?: number;
  freqEnd?: number;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

/**
 * Shared, lazily-created AudioContext. Browsers require it to be created
 * (or resumed) inside a user gesture. We create on first play.
 */
let sharedCtx: AudioContext | null = null;
function ensureCtx(): AudioContext | null {
  if (sharedCtx) {
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume();
    }
    return sharedCtx;
  }
  sharedCtx = getAudioContext();
  return sharedCtx;
}

function playNote(ctx: AudioContext, opts: NoteOpts, masterGain: number): void {
  const {
    freq,
    durationMs,
    type = 'sine',
    gain = 0.25,
    startDelay = 0,
    attack = 0.05,
    release = 0.4,
    freqEnd,
  } = opts;

  const start = ctx.currentTime + startDelay / 1000;
  const duration = durationMs / 1000;
  const end = start + duration;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(0.01, freqEnd),
      end,
    );
  }

  const peak = Math.max(0.0001, gain * masterGain);
  const attackEnd = start + duration * Math.max(0.001, attack);
  const releaseStart = end - duration * Math.max(0.001, release);
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(peak, attackEnd);
  gainNode.gain.setValueAtTime(peak, Math.max(attackEnd, releaseStart));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gainNode).connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

function playNoise(
  ctx: AudioContext,
  durationMs: number,
  gain: number,
  masterGain: number,
): void {
  const duration = durationMs / 1000;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  const peak = Math.max(0.0001, gain * masterGain);
  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(peak, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(gainNode).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration + 0.02);
}

export interface UseSoundEffectsApi {
  playHarvest: () => void;
  playCoinEarn: () => void;
  playPlant: () => void;
  playLightning: () => void;
  playTornado: () => void;
  playIce: () => void;
  playRain: () => void;
  playSnow: () => void;
  playMeteor: () => void;
  /** Dispatch a sound for any weather event id. */
  playWeather: (eventId: string) => void;
  playLotteryWin: (rare?: boolean) => void;
  playLotterySpin: () => void;
  playBuyUpgrade: () => void;
  playUnlockPlot: () => void;
  playButton: () => void;
}

export function useSoundEffects(): UseSoundEffectsApi {
  const muted = useGameStore((s) => s.settings.soundMuted);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Master gain factor — keeps overall volume mellow.
  const MASTER = 0.6;

  const guarded = useCallback(
    (fn: (ctx: AudioContext) => void) => {
      return () => {
        if (mutedRef.current) return;
        const ctx = ensureCtx();
        if (!ctx) return;
        try {
          fn(ctx);
        } catch {
          // Audio glitches must never break gameplay — swallow silently.
        }
      };
    },
    [],
  );

  const playHarvest = guarded((ctx) => {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      playNote(
        ctx,
        {
          freq,
          durationMs: 150,
          type: 'sine',
          gain: 0.3,
          startDelay: i * 110,
          attack: 0.05,
          release: 0.6,
        },
        MASTER,
      );
    });
  });

  const playCoinEarn = guarded((ctx) => {
    playNote(
      ctx,
      {
        freq: 880,
        durationMs: 60,
        type: 'sine',
        gain: 0.2,
        attack: 0.05,
        release: 0.7,
      },
      MASTER,
    );
    playNote(
      ctx,
      {
        freq: 1320,
        durationMs: 90,
        type: 'sine',
        gain: 0.14,
        startDelay: 30,
        attack: 0.05,
        release: 0.7,
      },
      MASTER,
    );
  });

  const playPlant = guarded((ctx) => {
    playNote(
      ctx,
      {
        freq: 200,
        durationMs: 110,
        type: 'sine',
        gain: 0.25,
        attack: 0.05,
        release: 0.9,
        freqEnd: 120,
      },
      MASTER,
    );
  });

  const playLightning = guarded((ctx) => {
    playNoise(ctx, 280, 0.35, MASTER);
    playNote(
      ctx,
      {
        freq: 110,
        durationMs: 300,
        type: 'sawtooth',
        gain: 0.25,
        attack: 0.02,
        release: 0.8,
        freqEnd: 60,
      },
      MASTER,
    );
  });

  const playLotteryWin = useCallback(
    (rare?: boolean) => {
      if (mutedRef.current) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      try {
        if (rare) {
          const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
          notes.forEach((freq, i) => {
            playNote(
              ctx,
              {
                freq,
                durationMs: 220,
                type: 'triangle',
                gain: 0.3,
                startDelay: i * 110,
                attack: 0.05,
                release: 0.6,
              },
              MASTER,
            );
          });
          [1046.5, 1318.5].forEach((freq, i) => {
            playNote(
              ctx,
              {
                freq,
                durationMs: 480,
                type: 'sine',
                gain: 0.18,
                startDelay: 600 + i * 120,
                attack: 0.05,
                release: 0.7,
              },
              MASTER,
            );
          });
        } else {
          const notes = [329.63, 392.0, 523.25];
          notes.forEach((freq, i) => {
            playNote(
              ctx,
              {
                freq,
                durationMs: 200,
                type: 'sine',
                gain: 0.28,
                startDelay: i * 150,
                attack: 0.05,
                release: 0.6,
              },
              MASTER,
            );
          });
        }
      } catch {
        // ignore
      }
    },
    [],
  );

  const playLotterySpin = guarded((ctx) => {
    playNote(
      ctx,
      {
        freq: 200,
        durationMs: 4000,
        type: 'sawtooth',
        gain: 0.12,
        attack: 0.03,
        release: 0.5,
        freqEnd: 800,
      },
      MASTER,
    );
  });

  const playBuyUpgrade = guarded((ctx) => {
    [523.25, 659.25].forEach((freq, i) => {
      playNote(
        ctx,
        {
          freq,
          durationMs: 150,
          type: 'square',
          gain: 0.2,
          startDelay: i * 130,
          attack: 0.05,
          release: 0.6,
        },
        MASTER,
      );
    });
  });

  const playUnlockPlot = guarded((ctx) => {
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, i) => {
      playNote(
        ctx,
        {
          freq,
          durationMs: 120,
          type: 'triangle',
          gain: 0.25,
          startDelay: i * 110,
          attack: 0.05,
          release: 0.6,
        },
        MASTER,
      );
    });
  });

  const playButton = guarded((ctx) => {
    playNote(
      ctx,
      {
        freq: 660,
        durationMs: 40,
        type: 'sine',
        gain: 0.1,
        attack: 0.1,
        release: 0.6,
      },
      MASTER,
    );
  });

  // ---- New weather sounds (per feature 3 spec) ----

  const playTornado = guarded((ctx) => {
    // Low rumbling sweep down.
    playNote(
      ctx,
      {
        freq: 240,
        durationMs: 900,
        type: 'sawtooth',
        gain: 0.22,
        attack: 0.05,
        release: 0.7,
        freqEnd: 60,
      },
      MASTER,
    );
    playNoise(ctx, 600, 0.18, MASTER);
  });

  const playIce = guarded((ctx) => {
    // High crystalline ping.
    playNote(
      ctx,
      {
        freq: 2100,
        durationMs: 200,
        type: 'triangle',
        gain: 0.18,
        attack: 0.02,
        release: 0.8,
        freqEnd: 1800,
      },
      MASTER,
    );
    playNote(
      ctx,
      {
        freq: 3200,
        durationMs: 280,
        type: 'sine',
        gain: 0.12,
        startDelay: 60,
        attack: 0.05,
        release: 0.8,
      },
      MASTER,
    );
  });

  const playRain = guarded((ctx) => {
    // Soft white noise burst.
    playNoise(ctx, 700, 0.18, MASTER);
  });

  const playSnow = guarded((ctx) => {
    // Gentle bell.
    [880, 1175, 1568].forEach((freq, i) => {
      playNote(
        ctx,
        {
          freq,
          durationMs: 300,
          type: 'sine',
          gain: 0.16,
          startDelay: i * 80,
          attack: 0.05,
          release: 0.85,
        },
        MASTER,
      );
    });
  });

  const playMeteor = guarded((ctx) => {
    // Deep impact + ascending pitch sweep.
    playNoise(ctx, 520, 0.4, MASTER);
    playNote(
      ctx,
      {
        freq: 60,
        durationMs: 320,
        type: 'sawtooth',
        gain: 0.32,
        attack: 0.02,
        release: 0.7,
        freqEnd: 30,
      },
      MASTER,
    );
    playNote(
      ctx,
      {
        freq: 180,
        durationMs: 900,
        type: 'triangle',
        gain: 0.22,
        startDelay: 220,
        attack: 0.05,
        release: 0.6,
        freqEnd: 880,
      },
      MASTER,
    );
  });

  const playWeather = useCallback(
    (eventId: string) => {
      switch (eventId) {
        case 'lightning':
          return playLightning();
        case 'tornado':
          return playTornado();
        case 'ice':
          return playIce();
        case 'rain':
          return playRain();
        case 'snow':
          return playSnow();
        case 'meteor':
          return playMeteor();
        default:
          return;
      }
    },
    [playLightning, playTornado, playIce, playRain, playSnow, playMeteor],
  );

  return {
    playHarvest,
    playCoinEarn,
    playPlant,
    playLightning,
    playTornado,
    playIce,
    playRain,
    playSnow,
    playMeteor,
    playWeather,
    playLotteryWin,
    playLotterySpin,
    playBuyUpgrade,
    playUnlockPlot,
    playButton,
  };
}
