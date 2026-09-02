import cardClick from "../Assets/sfx/card_click.mp3";
import cardFlip from "../Assets/sfx/card_flip.mp3";
import tavernChatter from "../Assets/sfx/tavern_chatter.mp3";
import thePire from "../Assets/sfx/thepire.mp3";
import troves from "../Assets/sfx/troves.mp3";
import uiClick from "../Assets/sfx/ui_click.mp3";
import billboard from "../Assets/sfx/billboard_sfx.mp3";

export type SfxKind = "card" | "flip" | "tavern" | "ui" | "board";

const SRC: Record<SfxKind, string> = {
  card: cardClick,
  flip: cardFlip,
  tavern: tavernChatter,
  ui: uiClick,
  board: billboard,
};

const VOLUME: Record<SfxKind, number> = {
  card: 0.55,
  flip: 0.6,
  tavern: 0.38,
  ui: 0.42,
  board: 0.62,
};

let tavernLoop: HTMLAudioElement | null = null;
let menuBgm: HTMLAudioElement | null = null;
let menuWanted = false;
let bgmIndex = 0;

const BGM_TRACKS = [thePire, troves];

const BGM_KEY = "wayfarers-hearth-bgm";

export interface BgmSettings {
  enabled: boolean;
  volume: number;
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
  audio.volume = settings.volume;
  if (!settings.enabled || !menuWanted) {
    audio.pause();
    return;
  }
  void audio.play().catch(() => {
    /* wait for a gesture */
  });
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
  const audio = new Audio(SRC[kind]);
  audio.volume = VOLUME[kind];
  void audio.play().catch(() => {
    /* browsers may block until a gesture; the click itself is the gesture */
  });
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
  if (kind === "flip" || kind === "card" || kind === "tavern" || kind === "ui" || kind === "board") return kind;
  if (el.closest(".portrait-card, .adv-card, .adv-portrait-wrap, .slot-face")) return "card";
  return "ui";
}
