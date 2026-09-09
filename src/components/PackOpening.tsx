import { useEffect, useRef, useState, type CSSProperties } from "react";
import packOpen3 from "../Assets/bg/pack_open3.mp4";
import { BACKGROUNDS } from "../data/backgrounds";
import { CARD_BY_ID } from "../data/cards";
import { ROLE_LABEL } from "../data/icons";
import { CARD_BACK } from "../data/portraits";
import { TRAITS } from "../data/traits";
import { duckMenuBgm, playSfx, restoreMenuBgm } from "../game/audio";
import type { PackResult } from "../types";
import { PortraitCard } from "./PortraitCard";

const HOLD_AFTER_END_MS = 320;
const FALLBACK_PAD_MS = 2_500;
const HARD_CAP_MS = 20_000;
const WHITE_IN_MS = 750;
const POP_MS = 700;
const CTA_AFTER_MS = 1_000;
const SKIP_TAIL_S = 2;

const FAN3 = [
  { x: "-8.6rem", y: "0.7rem", rot: "-10deg" },
  { x: "0rem", y: "-0.8rem", rot: "0deg" },
  { x: "8.6rem", y: "0.7rem", rot: "10deg" },
];

type Phase = "video" | "white" | "sealed" | "reveal" | "cta";

export function PackOpening({
  results,
  onBack,
  onCollection,
}: {
  results: PackResult[];
  onBack: () => void;
  onCollection: () => void;
}) {
  const pulls = results
    .map((result) => ({ result, template: CARD_BY_ID[result.cardId] }))
    .filter((entry): entry is { result: PackResult; template: NonNullable<typeof entry.template> } =>
      Boolean(entry.template),
    );
  const single = pulls.length === 1 ? pulls[0] : null;
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "sealed"
      : "video",
  );
  const [skipped, setSkipped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (pulls.length === 0) onBack();
  }, [pulls.length, onBack]);

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
      video.addEventListener("seeked", onPlaying);
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
      video?.removeEventListener("seeked", onPlaying);
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

  function skipVideo() {
    const video = videoRef.current;
    if (!video || skipped || done.current) return;
    setSkipped(true);
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      done.current = true;
      setPhase("white");
      return;
    }
    const target = Math.max(0, video.duration - SKIP_TAIL_S);
    if (video.currentTime < target) {
      try {
        video.currentTime = target;
      } catch {
        done.current = true;
        setPhase("white");
        return;
      }
    }
    void video.play().catch(() => {
      done.current = true;
      setPhase("white");
    });
  }

  function reveal() {
    if (phase !== "sealed") return;
    if (pulls.length > 1) playSfx("card");
    setPhase("reveal");
  }

  if (pulls.length === 0) return null;

  const showVideo = phase === "video" || phase === "white";
  const showCard = phase === "sealed" || phase === "reveal" || phase === "cta";
  const many = pulls.length > 1;

  return (
    <div className={`pack-open ${phase}${many ? " many" : ""}`} role="dialog" aria-modal="true" aria-label="Opening a pack">
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            className="pack-open-video"
            src={packOpen3}
            playsInline
            disablePictureInPicture
            preload="auto"
          />
          {phase === "video" && !skipped ? (
            <button type="button" className="pack-open-skip" onClick={skipVideo}>
              Skip
            </button>
          ) : null}
        </>
      ) : null}

      {showCard ? (
        <>
          <img className="pack-open-bg" src={BACKGROUNDS.tavern3} alt="" />
          <div className="pack-open-blur" />
          <div className="pack-open-vignette" />
          {many ? (
            <MultiPull pulls={pulls} phase={phase} onReveal={reveal} onBack={onBack} onCollection={onCollection} />
          ) : single ? (
            <SinglePull
              result={single.result}
              phase={phase}
              onReveal={reveal}
              onBack={onBack}
              onCollection={onCollection}
            />
          ) : null}
        </>
      ) : null}

      <div className="pack-open-flash" aria-hidden />
    </div>
  );
}

function SinglePull({
  result,
  phase,
  onReveal,
  onBack,
  onCollection,
}: {
  result: PackResult;
  phase: Phase;
  onReveal: () => void;
  onBack: () => void;
  onCollection: () => void;
}) {
  const template = CARD_BY_ID[result.cardId];
  if (!template) return null;
  const note = result.isNew
    ? `${template.name} joins the company!`
    : `Another likeness held in reserve — ${result.xp} XP waiting`;

  return (
    <div className="pack-open-focus">
      <p className="kicker pack-open-kicker">A name from the road</p>
      {phase === "sealed" ? (
        <button type="button" className="pack-open-sealed" data-sfx="flip" onClick={onReveal} aria-label="Turn the card">
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
      <PackActions phase={phase} onBack={onBack} onCollection={onCollection} />
    </div>
  );
}

function MultiPull({
  pulls,
  phase,
  onReveal,
  onBack,
  onCollection,
}: {
  pulls: { result: PackResult; template: NonNullable<(typeof CARD_BY_ID)[string]> }[];
  phase: Phase;
  onReveal: () => void;
  onBack: () => void;
  onCollection: () => void;
}) {
  const fanned = phase === "reveal" || phase === "cta";
  const wide = pulls.length > 3;

  return (
    <div className={`pack-open-focus ${fanned ? "fan-focus" : ""}`}>
      <p className="kicker pack-open-kicker">{fanned ? `${pulls.length} names from the road` : "Sealed names"}</p>
      {fanned ? (
        <div className="pack-open-fan-actions">
          <button className="cta opening-go" type="button" onClick={onBack}>
            Back to Tavern
          </button>
          <button className="cta opening-go" type="button" onClick={onCollection}>
            Go to Collection
          </button>
        </div>
      ) : null}
      {!fanned ? (
        <button type="button" className="pack-open-sealed" data-sfx="flip" onClick={onReveal} aria-label="Turn the cards">
          <span className="pack-open-glow" aria-hidden />
          <img src={CARD_BACK} alt="" draggable={false} />
        </button>
      ) : (
        <div className={`pack-open-fan ${wide ? "many" : ""}`} aria-label="Opened company">
          {pulls.map(({ result, template }, index) => {
            const pose = FAN3[index] ?? FAN3[1];
            return (
              <div
                key={`${result.cardId}-${index}`}
                className="fan-card"
                style={
                  wide
                    ? ({ ["--fan-delay" as string]: `${60 + index * 55}ms` } as CSSProperties)
                    : ({
                        ["--fan-x" as string]: pose.x,
                        ["--fan-y" as string]: pose.y,
                        ["--fan-rot" as string]: pose.rot,
                        ["--fan-delay" as string]: `${80 + index * 90}ms`,
                      } as CSSProperties)
                }
              >
                <div className={`idle-${index % 5}`}>
                  <PortraitCard template={template} owned size={wide ? "guild" : "inspect"} />
                  <p className="fan-role">{ROLE_LABEL[template.role]}</p>
                  <p className={`pack-open-fan-note ${result.isNew ? "new" : ""}`}>
                    {result.isNew ? "New" : `Likeness +${result.xp} XP`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {fanned ? null : <p className="opening-hint">A sealed company. Click to draw.</p>}
    </div>
  );
}

function PackActions({
  phase,
  onBack,
  onCollection,
}: {
  phase: Phase;
  onBack: () => void;
  onCollection: () => void;
}) {
  return (
    <div className="pack-open-actions" aria-hidden={phase !== "cta"}>
      <button className="cta" type="button" disabled={phase !== "cta"} onClick={onBack}>
        Back to Tavern
      </button>
      <button className="cta" type="button" disabled={phase !== "cta"} onClick={onCollection}>
        Go to Collection
      </button>
    </div>
  );
}
