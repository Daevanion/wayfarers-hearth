import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CHAPTER_BY_ID } from "../data/chapters";
import { CARD_BY_ID } from "../data/cards";
import { STORY_PORTRAITS } from "../data/storyPortraits";
import { cardPower } from "../game/formulas";
import { useGame } from "../store/GameContext";
import { CardZoom } from "./CardZoom";

const CardDossier = lazy(async () => {
  const mod = await import("./CardDossier");
  return { default: mod.CardDossier };
});

export function ChapterReader({ chapterId, onClose }: { chapterId: string; onClose: () => void }) {
  const { state } = useGame();
  const chapter = CHAPTER_BY_ID[chapterId];
  const [leaving, setLeaving] = useState(false);
  const [armed, setArmed] = useState(false);
  const [inspecting, setInspecting] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  const requestClose = useCallback(() => {
    setLeaving((current) => {
      if (current) return current;
      window.setTimeout(onClose, 240);
      return true;
    });
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (inspecting) return;
      event.stopImmediatePropagation();
      requestClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [inspecting, requestClose]);

  if (!chapter) return null;

  const inspectedOwned = inspecting ? state.cards.find((card) => card.id === inspecting) : null;
  const inspectedTemplate = inspecting ? CARD_BY_ID[inspecting] : null;

  return createPortal(
    <>
      <div
        className={`chapter-reader ${leaving ? "out" : ""} ${armed ? "armed" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          if (armed) requestClose();
        }}
        role="presentation"
      >
        <article
          className={`chapter-reader-panel ${leaving ? "out" : ""}`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chapter-reader-title"
        >
          <button type="button" className="icon-btn chapter-reader-close" onClick={requestClose} aria-label="Close">
            ✕
          </button>
          <aside className="chapter-cast">
            <ul>
              {chapter.cardIds.map((id) => {
                const template = CARD_BY_ID[id];
                const src = STORY_PORTRAITS[id] ?? template?.portrait;
                if (!template || !src) return null;
                return (
                  <li key={id}>
                    <button type="button" className="chapter-cast-btn" onClick={() => setInspecting(id)}>
                      <img src={src} alt="" />
                      <span>{template.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
          <div className="chapter-prose">
            <p className="kicker">Unsealed chapter</p>
            <h2 id="chapter-reader-title">{chapter.title}</h2>
            {chapter.body.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>
      {inspectedTemplate ? (
        <CardZoom onClose={() => setInspecting(null)} wide raised>
          <Suspense fallback={null}>
            <CardDossier
              template={inspectedTemplate}
              power={inspectedOwned ? cardPower(inspectedOwned) : inspectedTemplate.power}
              shown
            />
          </Suspense>
        </CardZoom>
      ) : null}
    </>,
    document.body,
  );
}
