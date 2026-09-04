import cardClick from "../Assets/sfx/card_click.mp3";
import cardFlip from "../Assets/sfx/card_flip.mp3";
import tavernChatter from "../Assets/sfx/tavern_chatter.mp3";
import thePire from "../Assets/sfx/thepire.mp3";
import whisperingWoods from "../Assets/sfx/whispering_elven_woods.mp3";
import uiClick from "../Assets/sfx/ui_click.mp3";
import billboard from "../Assets/sfx/billboard_sfx.mp3";
import questClick from "../Assets/sfx/quest_click.mp3";

export type SfxKind = "card" | "flip" | "tavern" | "ui" | "board" | "quest";

const SRC: Record<SfxKind, string> = {
  card: cardClick,
  flip: cardFlip,
  tavern: tavernChatter,
  ui: uiClick,
  board: billboard,
  quest: questClick,
};

const VOLUME: Record<SfxKind, number> = {
  card: 0.55,
  flip: 0.6,
  tavern: 0.38,
  ui: 0.42,
  board: 0.62,
  quest: 0.58,
};

const ONE_SHOT: SfxKind[] = ["card", "flip", "ui", "board", "quest"];

let tavernLoop: HTMLAudioElement | null = null;
let menuBgm: HTMLAudioElement | null = null;
let menuWanted = false;
let bgmIndex = 0;
let bgmDuck = 1;
let sfxCtx: AudioContext | null = null;
let sfxPreload: Promise<void> | null = null;
const sfxBuffers: Partial<Record<SfxKind, AudioBuffer>> = {};
const sfxNodes: Partial<Record<SfxKind, HTMLAudioElement[]>> = {};
const sfxRaw: Partial<Record<SfxKind, ArrayBuffer>> = {};
let sfxFetch: Promise<void> | null = null;

const BGM_TRACKS = [thePire, whisperingWoods];

const BGM_KEY = "wayfarers-hearth-bgm";

export interface BgmSettings {
  enabled: boolean;
  volume: number;
}

function sfxContext(): AudioContext {
  if (!sfxCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sfxCtx = new Ctor();
  }
  return sfxCtx;
}

function htmlPool(kind: SfxKind): HTMLAudioElement[] {
  let pool = sfxNodes[kind];
  if (!pool) {
    const primed = new Audio(SRC[kind]);
    primed.preload = "auto";
    primed.volume = VOLUME[kind];
    pool = [primed];
    sfxNodes[kind] = pool;
  }
  return pool;
}

async function fetchSfx(): Promise<void> {
  await Promise.all(
    ONE_SHOT.map(async (kind) => {
      htmlPool(kind);
      if (sfxRaw[kind]) return;
      try {
        const res = await fetch(SRC[kind]);
        sfxRaw[kind] = await res.arrayBuffer();
      } catch {
        /* HTMLAudio fallback stays armed */
      }
    }),
  );
}

function ensureFetched(): Promise<void> {
  if (!sfxFetch) sfxFetch = fetchSfx();
  return sfxFetch;
}

async function decodeSfx(): Promise<void> {
  await ensureFetched();
  const ctx = sfxContext();
  await Promise.all(
    ONE_SHOT.map(async (kind) => {
      const raw = sfxRaw[kind];
      if (sfxBuffers[kind] || !raw) return;
      try {
        sfxBuffers[kind] = await ctx.decodeAudioData(raw.slice(0));
      } catch {
        /* HTMLAudio fallback stays armed */
      }
    }),
  );
}

export function unlockAudio(): void {
  const ctx = sfxContext();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  if (!sfxPreload) sfxPreload = decodeSfx();
}

function playBuffered(kind: SfxKind): boolean {
  const ctx = sfxCtx;
  const buffer = sfxBuffers[kind];
  if (!ctx || ctx.state !== "running" || !buffer) return false;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = VOLUME[kind];
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(0);
  return true;
}

function playHtml(kind: SfxKind): void {
  const pool = htmlPool(kind);
  let node = pool.find((audio) => audio.paused || audio.ended);
  if (!node) {
    node = pool[0].cloneNode(true) as HTMLAudioElement;
    node.preload = "auto";
    pool.push(node);
  }
  node.volume = VOLUME[kind];
  try {
    node.currentTime = 0;
  } catch {
    /* some browsers throw if the element is still loading */
  }
  void node.play().catch(() => {
    /* wait for a later gesture */
  });
}

export function loadBgmSettings(): BgmSettings {
  try {
    const raw = localStorage.getItem(BGM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BgmSettings>;
      const volume = Number(parsed.volume);
      return {
        enabled: parsed.enabled !== false,
        volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.42,
      };
    }
  } catch {
    /* keep defaults */
  }
  return { enabled: true, volume: 0.42 };
}

export function saveBgmSettings(next: BgmSettings): void {
  localStorage.setItem(BGM_KEY, JSON.stringify(next));
  applyBgmSettings(next);
}

function onBgmEnded(): void {
  bgmIndex = (bgmIndex + 1) % BGM_TRACKS.length;
  if (!menuBgm) return;
  menuBgm.src = BGM_TRACKS[bgmIndex];
  const settings = loadBgmSettings();
  menuBgm.volume = settings.volume;
  if (menuWanted && settings.enabled) {
    void menuBgm.play().catch(() => {
      /* wait for a gesture */
    });
  }
}

function ensureMenuBgm(): HTMLAudioElement {
  if (!menuBgm) {
    menuBgm = new Audio(BGM_TRACKS[bgmIndex]);
    menuBgm.loop = false;
    menuBgm.volume = loadBgmSettings().volume;
    menuBgm.addEventListener("ended", onBgmEnded);
  }
  return menuBgm;
}

function applyBgmSettings(settings: BgmSettings): void {
  const audio = ensureMenuBgm();
  audio.volume = settings.volume * bgmDuck;
  if (!settings.enabled || !menuWanted) {
    audio.pause();
    return;
  }
  void audio.play().catch(() => {
    /* wait for a gesture */
  });
}

export function duckMenuBgm(amount = 0.08): void {
  bgmDuck = amount;
  applyBgmSettings(loadBgmSettings());
}

export function restoreMenuBgm(): void {
  bgmDuck = 1;
  applyBgmSettings(loadBgmSettings());
}

export function startMenuBgm(): void {
  menuWanted = true;
  applyBgmSettings(loadBgmSettings());
}

export function pauseMenuBgm(): void {
  menuWanted = false;
  menuBgm?.pause();
}

export function playSfx(kind: SfxKind): void {
  if (kind === "tavern") {
    startTavernAmbience();
    return;
  }
  unlockAudio();
  if (playBuffered(kind)) return;
  playHtml(kind);
}

export function startTavernAmbience(): void {
  stopTavernAmbience();
  const audio = new Audio(SRC.tavern);
  audio.loop = true;
  audio.volume = VOLUME.tavern;
  tavernLoop = audio;
  void audio.play().catch(() => {
    /* need a user gesture */
  });
}

export function stopTavernAmbience(): void {
  if (!tavernLoop) return;
  tavernLoop.pause();
  tavernLoop.currentTime = 0;
  tavernLoop = null;
}

export function sfxFromEventTarget(target: EventTarget | null): SfxKind | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest("button, [role='tab'], [role='button'], [data-sfx], a[href], summary");
  if (!(el instanceof HTMLElement)) return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  if (el.getAttribute("aria-disabled") === "true") return null;
  const kind = el.getAttribute("data-sfx") ?? el.closest("[data-sfx]")?.getAttribute("data-sfx");
  if (kind === "flip" || kind === "card" || kind === "tavern" || kind === "ui" || kind === "board" || kind === "quest") {
    return kind;
  }
  if (el.closest(".quest-slide-btn")) return null;
  if (el.closest(".portrait-card, .adv-card, .adv-portrait-wrap, .slot-face")) return "card";
  return "ui";
}

if (typeof window !== "undefined") {
  for (const kind of ONE_SHOT) htmlPool(kind);
  void ensureFetched();
}
