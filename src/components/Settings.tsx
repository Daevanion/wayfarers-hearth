import { useEffect, useRef, useState } from "react";
import { loadBgmSettings, saveBgmSettings, startMenuBgm, type BgmSettings } from "../game/audio";
import { useGame } from "../store/GameContext";

export function Settings() {
  const { ui, grantDebugFunds, startVn } = useGame();
  const [open, setOpen] = useState(false);
  const [bgm, setBgm] = useState<BgmSettings>(() => loadBgmSettings());
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function update(partial: Partial<BgmSettings>) {
    const next = { ...bgm, ...partial };
    setBgm(next);
    saveBgmSettings(next);
    if (next.enabled) startMenuBgm();
  }

  return (
    <div className={`settings ${open ? "open" : ""}`} ref={box}>
      {open ? (
        <div className="settings-panel" role="dialog" aria-label="Settings">
          <p className="kicker">Settings</p>
          <label className="settings-row">
            <span>Menu music</span>
            <button
              type="button"
              className={bgm.enabled ? "chip on" : "chip"}
              onClick={() => update({ enabled: !bgm.enabled })}
            >
              {bgm.enabled ? "On" : "Off"}
            </button>
          </label>
          <label className="settings-row volume">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bgm.volume}
              disabled={!bgm.enabled}
              onChange={(event) => update({ volume: Number(event.target.value) })}
            />
            <em>{Math.round(bgm.volume * 100)}</em>
          </label>
          <button
            type="button"
            className="settings-debug"
            disabled={ui.screen !== "plaza"}
            onClick={grantDebugFunds}
          >
            Debug: +1000 gold, +100 tokens
          </button>
          <button
            type="button"
            className="settings-debug"
            onClick={() => {
              setOpen(false);
              startVn("hearthbound-arrival");
            }}
          >
            Debug: Arrival dialogue
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="settings-gear"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open && bgm.enabled) startMenuBgm();
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64L4.86 10.7c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.69.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.26.12.55.02.69-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
          />
        </svg>
      </button>
    </div>
  );
}
