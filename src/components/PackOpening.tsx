import { useEffect, useRef, useState } from "react";
import packOpen3 from "../Assets/bg/pack_open3.mp4";
import { BACKGROUNDS } from "../data/backgrounds";
import { CARD_BY_ID } from "../data/cards";
import { ROLE_LABEL } from "../data/icons";
import { CARD_BACK } from "../data/portraits";
import { TRAITS } from "../data/traits";
import { duckMenuBgm, restoreMenuBgm } from "../game/audio";
import type { PackResult } from "../types";
import { PortraitCard } from "./PortraitCard";

const HOLD_AFTER_END_MS = 320;
const FALLBACK_PAD_MS = 2_500;
const HARD_CAP_MS = 20_000;
const WHITE_IN_MS = 750;
const POP_MS = 700;
const CTA_AFTER_MS = 1_000;

type Phase = "video" | "white" | "sealed" | "reveal" | "cta";

export function PackOpening({
  result,
  onBack,
  onCollection,
}: {
  result: PackResult;
  onBack: () => void;
  onCollection: () => void;
}) {
  const template = CARD_BY_ID[result.cardId];
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "sealed"
      : "video",
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!template) onBack();
  }, [template, onBack]);

  useEffect(() => {
    if (phase !== "video") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("sealed");
      return;
    }

    duckMenuBgm();
    const video = videoRef.current;
    let fallbackId = 0;
    let holdId = 0;

    function finishVideo() {
      if (done.current) return;
      done.current = true;
      window.clearTimeout(fallbackId);
      holdId = window.setTimeout(() => setPhase("white"), HOLD_AFTER_END_MS);
    }

    function armFallback(ms: number) {
      window.clearTimeout(fallbackId);
      fallbackId = window.setTimeout(finishVideo, ms);
    }

    function onPlaying() {
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
        armFallback(HARD_CAP_MS);
        return;
      }
      const remaining = Math.max(0, video.duration - video.currentTime) * 1000 + FALLBACK_PAD_MS;
      armFallback(remaining);
    }

    if (video) {
      video.addEventListener("ended", finishVideo);
      video.addEventListener("playing", onPlaying);
      void video.play().catch(async () => {
        video.muted = true;
        try {
          await video.play();
        } catch {
          finishVideo();
        }
      });
    }
    armFallback(HARD_CAP_MS);

    return () => {
      video?.removeEventListener("ended", finishVideo);
      video?.removeEventListener("playing", onPlaying);
      window.clearTimeout(fallbackId);
      window.clearTimeout(holdId);
      restoreMenuBgm();
    };
  }, []);

  useEffect(() => {
    if (phase !== "white") return;
    restoreMenuBgm();
    const next = window.setTimeout(() => setPhase("sealed"), WHITE_IN_MS);
    return () => window.clearTimeout(next);
  }, [phase]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const next = window.setTimeout(() => setPhase("cta"), POP_MS + CTA_AFTER_MS);
    return () => window.clearTimeout(next);
  }, [phase]);

  function reveal() {
    if (phase !== "sealed") return;
    setPhase("reveal");
  }

  if (!template) return null;

  const showVideo = phase === "video" || phase === "white";
  const showCard = phase === "sealed" || phase === "reveal" || phase === "cta";
  const note = result.isNew ? `${template.name} joins the company!` : `Another likeness — +${result.xp} XP`;

  return (
    <div className={`pack-open ${phase}`} role="dialog" aria-modal="true" aria-label="Opening a pack">
      {showVideo ? (
        <video
          ref={videoRef}
          className="pack-open-video"
          src={packOpen3}
          playsInline
          disablePictureInPicture
          preload="auto"
        />
      ) : null}

      {showCard ? (
        <>
          <img className="pack-open-bg" src={BACKGROUNDS.tavern3} alt="" />
          <div className="pack-open-blur" />
          <div className="pack-open-vignette" />
          <div className="pack-open-focus">
            <p className="kicker pack-open-kicker">A name from the road</p>
            {phase === "sealed" ? (
              <button
                type="button"
                className="pack-open-sealed"
                data-sfx="flip"
                onClick={reveal}
                aria-label="Turn the card"
              >
                <span className="pack-open-glow" aria-hidden />
                <img src={CARD_BACK} alt="" draggable={false} />
              </button>
            ) : (
              <div className={`pack-open-face rarity-${template.rarity}`}>
                <span className="pack-open-glow" aria-hidden />
                <PortraitCard template={template} owned size="inspect" />
              </div>
            )}
            <div className="pack-open-info">
              <h2>{template.name}</h2>
              <p className="pack-open-title">{template.title}</p>
              <p className="pack-open-role">{ROLE_LABEL[template.role]}</p>
              <ul className="trait-chips dossier-traits pack-open-traits">
                {template.traits.map((id) => {
                  const def = TRAITS[id];
                  if (!def) return null;
                  return (
                    <li key={id} className={def.good ? "good" : "bad"}>
                      <strong>{def.name}</strong>
                      <em>{def.blurb}</em>
                    </li>
                  );
                })}
              </ul>
              <p className={`pack-open-note ${result.isNew ? "new" : ""}`}>{note}</p>
            </div>
            <div className="pack-open-actions" aria-hidden={phase !== "cta"}>
              <button className="cta" type="button" disabled={phase !== "cta"} onClick={onBack}>
                Back to Tavern
              </button>
              <button className="cta" type="button" disabled={phase !== "cta"} onClick={onCollection}>
                Go to Collection
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div className="pack-open-flash" aria-hidden />
    </div>
  );
}
